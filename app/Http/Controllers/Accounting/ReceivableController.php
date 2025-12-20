<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\BankAccount;
use App\Models\Customer;
use App\Models\JournalEntry;
use App\Models\Receivable;
use App\Models\ReceivablePayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReceivableController extends Controller
{
    public function index(Request $request)
    {
        $query = Receivable::with(['customer', 'createdBy']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('invoice_number', 'like', "%{$request->search}%")
                    ->orWhereHas('customer', function ($cq) use ($request) {
                        $cq->where('name', 'like', "%{$request->search}%");
                    });
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        $receivables = $query->orderBy('due_date')
            ->paginate(20);

        // Get summary
        $summary = [
            'total_outstanding' => Receivable::whereNotIn('status', ['paid', 'void', 'bad_debt'])->sum('balance_due'),
            'overdue' => Receivable::where('due_date', '<', now())
                ->whereNotIn('status', ['paid', 'void', 'bad_debt'])
                ->sum('balance_due'),
            'due_this_week' => Receivable::whereBetween('due_date', [now(), now()->addDays(7)])
                ->whereNotIn('status', ['paid', 'void', 'bad_debt'])
                ->sum('balance_due'),
        ];

        // Aging report
        $aging = [
            'current' => Receivable::where('due_date', '>=', now())
                ->whereNotIn('status', ['paid', 'void', 'bad_debt'])
                ->sum('balance_due'),
            '1_30' => Receivable::whereBetween('due_date', [now()->subDays(30), now()->subDay()])
                ->whereNotIn('status', ['paid', 'void', 'bad_debt'])
                ->sum('balance_due'),
            '31_60' => Receivable::whereBetween('due_date', [now()->subDays(60), now()->subDays(31)])
                ->whereNotIn('status', ['paid', 'void', 'bad_debt'])
                ->sum('balance_due'),
            '61_90' => Receivable::whereBetween('due_date', [now()->subDays(90), now()->subDays(61)])
                ->whereNotIn('status', ['paid', 'void', 'bad_debt'])
                ->sum('balance_due'),
            'over_90' => Receivable::where('due_date', '<', now()->subDays(90))
                ->whereNotIn('status', ['paid', 'void', 'bad_debt'])
                ->sum('balance_due'),
        ];

        $customers = Customer::orderBy('name')->get(['id', 'name']);

        return Inertia::render('accounting/receivables/index', [
            'receivables' => $receivables,
            'summary' => $summary,
            'aging' => $aging,
            'customers' => $customers,
            'filters' => $request->only(['search', 'status', 'customer_id']),
        ]);
    }

    public function create()
    {
        $customers = Customer::orderBy('name')->get();
        $incomeAccounts = Account::where('type', 'income')
            ->where('is_active', true)
            ->orderBy('code')
            ->get();

        return Inertia::render('accounting/receivables/create', [
            'customers' => $customers,
            'incomeAccounts' => $incomeAccounts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'subtotal' => 'required|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $validated['invoice_number'] = Receivable::generateInvoiceNumber();
        $validated['tax_amount'] = $validated['tax_amount'] ?? 0;
        $validated['total_amount'] = $validated['subtotal'] + $validated['tax_amount'];
        $validated['balance_due'] = $validated['total_amount'];
        $validated['paid_amount'] = 0;
        $validated['status'] = 'pending';
        $validated['created_by'] = auth()->id();

        $receivable = Receivable::create($validated);

        // Create journal entry
        $this->createReceivableJournalEntry($receivable);

        return redirect()->route('accounting.receivables.index')
            ->with('success', 'Invoice created successfully.');
    }

    public function show(Receivable $receivable)
    {
        $receivable->load(['customer', 'payments.createdBy', 'journalEntry.lines.account', 'createdBy', 'order']);

        return Inertia::render('accounting/receivables/show', [
            'receivable' => $receivable,
        ]);
    }

    public function recordPayment(Request $request, Receivable $receivable)
    {
        $validated = $request->validate([
            'payment_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01|max:' . $receivable->balance_due,
            'payment_method' => 'required|in:cash,bank_transfer,cheque,card,other',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
            'reference' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $receivable) {
            $payment = ReceivablePayment::create([
                'receivable_id' => $receivable->id,
                'payment_number' => ReceivablePayment::generatePaymentNumber(),
                'payment_date' => $validated['payment_date'],
                'amount' => $validated['amount'],
                'payment_method' => $validated['payment_method'],
                'bank_account_id' => $validated['bank_account_id'],
                'reference' => $validated['reference'],
                'notes' => $validated['notes'],
                'created_by' => auth()->id(),
            ]);

            // Create payment journal entry
            $this->createPaymentJournalEntry($receivable, $payment);
        });

        return redirect()->back()->with('success', 'Payment recorded successfully.');
    }

    public function markAsBadDebt(Receivable $receivable)
    {
        DB::transaction(function () use ($receivable) {
            $receivable->markAsBadDebt();

            // Create bad debt journal entry
            $arAccount = Account::where('subtype', 'accounts_receivable')->first();
            $badDebtAccount = Account::where('subtype', 'other_expense')
                ->where('name', 'like', '%bad debt%')
                ->first();

            if (!$badDebtAccount) {
                $badDebtAccount = Account::where('subtype', 'other_expense')->first();
            }

            if ($arAccount && $badDebtAccount && $receivable->balance_due > 0) {
                $entry = JournalEntry::create([
                    'entry_number' => JournalEntry::generateEntryNumber(),
                    'entry_date' => now(),
                    'reference' => $receivable->invoice_number,
                    'description' => 'Bad Debt Write-off: ' . $receivable->customer->name,
                    'source' => 'adjustment',
                    'source_type' => Receivable::class,
                    'source_id' => $receivable->id,
                    'total_debit' => $receivable->balance_due,
                    'total_credit' => $receivable->balance_due,
                    'created_by' => auth()->id(),
                    'status' => 'posted',
                    'posted_by' => auth()->id(),
                    'posted_at' => now(),
                ]);

                $entry->lines()->create([
                    'account_id' => $badDebtAccount->id,
                    'description' => 'Bad debt expense',
                    'debit' => $receivable->balance_due,
                    'credit' => 0,
                    'line_order' => 0,
                ]);

                $entry->lines()->create([
                    'account_id' => $arAccount->id,
                    'description' => 'Write-off receivable',
                    'debit' => 0,
                    'credit' => $receivable->balance_due,
                    'line_order' => 1,
                ]);
            }
        });

        return redirect()->back()->with('success', 'Marked as bad debt.');
    }

    private function createReceivableJournalEntry(Receivable $receivable): void
    {
        $arAccount = Account::where('subtype', 'accounts_receivable')->first();
        $salesAccount = Account::where('subtype', 'sales')->first();

        if (!$arAccount || !$salesAccount) {
            return;
        }

        $entry = JournalEntry::create([
            'entry_number' => JournalEntry::generateEntryNumber(),
            'entry_date' => $receivable->invoice_date,
            'reference' => $receivable->invoice_number,
            'description' => 'Customer Invoice: ' . $receivable->customer->name,
            'source' => 'sales',
            'source_type' => Receivable::class,
            'source_id' => $receivable->id,
            'total_debit' => $receivable->total_amount,
            'total_credit' => $receivable->total_amount,
            'created_by' => auth()->id(),
            'status' => 'posted',
            'posted_by' => auth()->id(),
            'posted_at' => now(),
        ]);

        // Debit Accounts Receivable
        $entry->lines()->create([
            'account_id' => $arAccount->id,
            'description' => 'Receivable from ' . $receivable->customer->name,
            'debit' => $receivable->total_amount,
            'credit' => 0,
            'line_order' => 0,
        ]);

        // Credit Sales Revenue
        $entry->lines()->create([
            'account_id' => $salesAccount->id,
            'description' => $receivable->description,
            'debit' => 0,
            'credit' => $receivable->total_amount,
            'line_order' => 1,
        ]);

        $receivable->update(['journal_entry_id' => $entry->id]);
    }

    private function createPaymentJournalEntry(Receivable $receivable, ReceivablePayment $payment): void
    {
        $arAccount = Account::where('subtype', 'accounts_receivable')->first();
        
        $cashAccount = $payment->bank_account_id
            ? BankAccount::find($payment->bank_account_id)->account
            : Account::where('subtype', 'cash')->first();

        if (!$arAccount || !$cashAccount) {
            return;
        }

        $entry = JournalEntry::create([
            'entry_number' => JournalEntry::generateEntryNumber(),
            'entry_date' => $payment->payment_date,
            'reference' => $payment->payment_number,
            'description' => 'Payment received for Invoice: ' . $receivable->invoice_number,
            'source' => 'payment',
            'source_type' => ReceivablePayment::class,
            'source_id' => $payment->id,
            'total_debit' => $payment->amount,
            'total_credit' => $payment->amount,
            'created_by' => auth()->id(),
            'status' => 'posted',
            'posted_by' => auth()->id(),
            'posted_at' => now(),
        ]);

        // Debit Cash/Bank
        $entry->lines()->create([
            'account_id' => $cashAccount->id,
            'description' => 'Payment from ' . $receivable->customer->name,
            'debit' => $payment->amount,
            'credit' => 0,
            'line_order' => 0,
        ]);

        // Credit Accounts Receivable
        $entry->lines()->create([
            'account_id' => $arAccount->id,
            'description' => 'Payment for ' . $receivable->invoice_number,
            'debit' => 0,
            'credit' => $payment->amount,
            'line_order' => 1,
        ]);

        $payment->update(['journal_entry_id' => $entry->id]);
    }
}
