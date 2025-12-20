<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\BankAccount;
use App\Models\JournalEntry;
use App\Models\Payable;
use App\Models\PayablePayment;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PayableController extends Controller
{
    public function index(Request $request)
    {
        $query = Payable::with(['supplier', 'createdBy']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('invoice_number', 'like', "%{$request->search}%")
                    ->orWhereHas('supplier', function ($sq) use ($request) {
                        $sq->where('name', 'like', "%{$request->search}%");
                    });
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        $payables = $query->orderBy('due_date')
            ->paginate(20);

        // Get summary
        $summary = [
            'total_outstanding' => Payable::whereNotIn('status', ['paid', 'void'])->sum('balance_due'),
            'overdue' => Payable::where('due_date', '<', now())
                ->whereNotIn('status', ['paid', 'void'])
                ->sum('balance_due'),
            'due_this_week' => Payable::whereBetween('due_date', [now(), now()->addDays(7)])
                ->whereNotIn('status', ['paid', 'void'])
                ->sum('balance_due'),
        ];

        $suppliers = Supplier::orderBy('name')->get(['id', 'name']);

        return Inertia::render('accounting/payables/index', [
            'payables' => $payables,
            'summary' => $summary,
            'suppliers' => $suppliers,
            'filters' => $request->only(['search', 'status', 'supplier_id']),
        ]);
    }

    public function create()
    {
        $suppliers = Supplier::orderBy('name')->get();
        $expenseAccounts = Account::where('type', 'expense')
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        return Inertia::render('accounting/payables/create', [
            'suppliers' => $suppliers,
            'expenseAccounts' => $expenseAccounts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'subtotal' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['invoice_number'] = Payable::generateInvoiceNumber();
        $validated['tax_amount'] = $validated['tax_amount'] ?? 0;
        $validated['total_amount'] = $validated['subtotal'] + $validated['tax_amount'];
        $validated['balance_due'] = $validated['total_amount'];
        $validated['paid_amount'] = 0;
        $validated['status'] = 'pending';
        $validated['created_by'] = auth()->id();

        $payable = Payable::create($validated);

        // Create journal entry
        $this->createPayableJournalEntry($payable);

        return redirect()->route('accounting.payables.index')
            ->with('success', 'Payable invoice created successfully.');
    }

    public function show(Payable $payable)
    {
        $payable->load(['supplier', 'payments.createdBy', 'journalEntry.lines.account', 'createdBy']);

        return Inertia::render('accounting/payables/show', [
            'payable' => $payable,
        ]);
    }

    public function recordPayment(Request $request, Payable $payable)
    {
        $validated = $request->validate([
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01|max:' . $payable->balance_due,
            'payment_method' => 'required|in:cash,bank_transfer,cheque,other',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'reference' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $payable) {
            $payment = PayablePayment::create([
                'payable_id' => $payable->id,
                'payment_number' => PayablePayment::generatePaymentNumber(),
                'payment_date' => $validated['payment_date'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'bank_account_id' => $validated['bank_account_id'],
                'reference' => $validated['reference'],
                'notes' => $validated['notes'],
                'created_by' => auth()->id(),
            ]);

            // Create payment journal entry
            $this->createPaymentJournalEntry($payable, $payment);
        });

        return redirect()->back()->with('success', 'Payment recorded successfully.');
    }

    private function createPayableJournalEntry(Payable $payable): void
    {
        $apAccount = Account::where('subtype', 'accounts_payable')->first();
        $expenseAccount = Account::where('subtype', 'operating_expense')->first();

        if (!$apAccount || !$expenseAccount) {
            return;
        }

        $entry = JournalEntry::create([
            'entry_number' => JournalEntry::generateEntryNumber(),
            'entry_date' => $payable->invoice_date,
            'reference' => $payable->invoice_number,
            'description' => 'Supplier Invoice: ' . $payable->supplier->name,
            'source' => 'purchase',
            'source_type' => Payable::class,
            'source_id' => $payable->id,
            'total_debit' => $payable->total_amount,
            'total_credit' => $payable->total_amount,
            'created_by' => auth()->id(),
            'status' => 'posted',
            'posted_by' => auth()->id(),
            'posted_at' => now(),
        ]);

        // Debit Expense
        $entry->lines()->create([
            'account_id' => $expenseAccount->id,
            'description' => $payable->description,
            'debit' => $payable->total_amount,
            'credit' => 0,
            'line_order' => 0,
        ]);

        // Credit Accounts Payable
        $entry->lines()->create([
            'account_id' => $apAccount->id,
            'description' => 'Payable to ' . $payable->supplier->name,
            'debit' => 0,
            'credit' => $payable->total_amount,
            'line_order' => 1,
        ]);

        $payable->update(['journal_entry_id' => $entry->id]);
    }

    private function createPaymentJournalEntry(Payable $payable, PayablePayment $payment): void
    {
        $apAccount = Account::where('subtype', 'accounts_payable')->first();
        
        $cashAccount = $payment->bank_account_id
            ? BankAccount::find($payment->bank_account_id)->account
            : Account::where('subtype', 'cash')->first();

        if (!$apAccount || !$cashAccount) {
            return;
        }

        $entry = JournalEntry::create([
            'entry_number' => JournalEntry::generateEntryNumber(),
            'entry_date' => $payment->payment_date,
            'reference' => $payment->payment_number,
            'description' => 'Payment for Invoice: ' . $payable->invoice_number,
            'source' => 'payment',
            'source_type' => PayablePayment::class,
            'source_id' => $payment->id,
            'total_debit' => $payment->amount,
            'total_credit' => $payment->amount,
            'created_by' => auth()->id(),
            'status' => 'posted',
            'posted_by' => auth()->id(),
            'posted_at' => now(),
        ]);

        // Debit Accounts Payable
        $entry->lines()->create([
            'account_id' => $apAccount->id,
            'description' => 'Payment to ' . $payable->supplier->name,
            'debit' => $payment->amount,
            'credit' => 0,
            'line_order' => 0,
        ]);

        // Credit Cash/Bank
        $entry->lines()->create([
            'account_id' => $cashAccount->id,
            'description' => 'Payment for ' . $payable->invoice_number,
            'debit' => 0,
            'credit' => $payment->amount,
            'line_order' => 1,
        ]);

        $payment->update(['journal_entry_id' => $entry->id]);
    }
}
