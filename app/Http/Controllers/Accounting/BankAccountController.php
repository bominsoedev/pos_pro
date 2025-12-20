<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\BankAccount;
use App\Models\BankReconciliation;
use App\Models\BankTransaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class BankAccountController extends Controller
{
    public function index(Request $request)
    {
        $bankAccounts = BankAccount::with(['account'])
            ->orderBy('bank_name')
            ->get();

        $accounts = Account::where('is_active', true)
            ->where('subtype', 'bank')
            ->orderBy('code')
            ->get();

        return Inertia::render('accounting/bank-accounts/index', [
            'bankAccounts' => $bankAccounts,
            'accounts' => $accounts,
        ]);
    }

    public function create()
    {
        $glAccounts = Account::where('is_active', true)
            ->where('subtype', 'bank')
            ->orderBy('code')
            ->get();

        return Inertia::render('accounting/bank-accounts/create', [
            'glAccounts' => $glAccounts,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'nullable|exists:accounts,id',
            'name' => 'required|string|max:255',
            'bank_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'account_type' => 'required|in:checking,savings,credit_card',
            'currency' => 'required|string|max:10',
            'opening_balance' => 'nullable|numeric',
            'description' => 'nullable|string',
        ]);

        $validated['current_balance'] = $validated['opening_balance'] ?? 0;
        $validated['is_active'] = true;

        BankAccount::create($validated);

        return redirect()->route('accounting.bank-accounts.index')
            ->with('success', 'Bank account created successfully.');
    }

    public function show(BankAccount $bankAccount)
    {
        $bankAccount->load('account');

        $transactions = $bankAccount->transactions()
            ->orderBy('transaction_date', 'desc')
            ->paginate(50);

        return Inertia::render('accounting/bank-accounts/show', [
            'bankAccount' => $bankAccount,
            'transactions' => $transactions,
        ]);
    }

    public function update(Request $request, BankAccount $bankAccount)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'bank_name' => 'required|string|max:255',
            'account_number' => 'required|string|max:255',
            'account_type' => 'required|in:checking,savings,credit_card',
            'currency' => 'required|string|max:10',
            'opening_balance' => 'nullable|numeric',
            'account_id' => 'nullable|exists:accounts,id',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $bankAccount->update($validated);

        return redirect()->back()->with('success', 'Bank account updated successfully.');
    }

    public function destroy(BankAccount $bankAccount)
    {
        if ($bankAccount->transactions()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete bank account with transactions.');
        }

        $bankAccount->delete();

        return redirect()->route('accounting.bank-accounts.index')
            ->with('success', 'Bank account deleted successfully.');
    }

    public function importTransactions(Request $request, BankAccount $bankAccount)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        
        // Skip header
        fgetcsv($handle);

        $imported = 0;
        DB::transaction(function () use ($handle, $bankAccount, &$imported) {
            while (($row = fgetcsv($handle)) !== false) {
                if (count($row) >= 4) {
                    BankTransaction::create([
                        'bank_account_id' => $bankAccount->id,
                        'transaction_date' => $row[0],
                        'description' => $row[1],
                        'amount' => floatval($row[2]),
                        'balance' => isset($row[3]) ? floatval($row[3]) : null,
                        'type' => floatval($row[2]) >= 0 ? 'deposit' : 'withdrawal',
                        'is_imported' => true,
                    ]);
                    $imported++;
                }
            }
        });

        fclose($handle);

        return redirect()->back()->with('success', "{$imported} transactions imported successfully.");
    }

    public function reconcile(Request $request, BankAccount $bankAccount)
    {
        $bankAccount->load('account');

        // Get unreconciled bank transactions
        $bankTransactions = $bankAccount->transactions()
            ->where('is_reconciled', false)
            ->orderBy('transaction_date')
            ->get();

        // Get unreconciled book transactions (journal entry lines for this bank's GL account)
        $bookTransactions = [];
        if ($bankAccount->account) {
            $bookTransactions = $bankAccount->account->journalEntryLines()
                ->with('journalEntry')
                ->whereHas('journalEntry', function ($q) {
                    $q->where('status', 'posted');
                })
                ->get();
        }

        return Inertia::render('accounting/bank-accounts/reconcile', [
            'bankAccount' => $bankAccount,
            'bankTransactions' => $bankTransactions,
            'bookTransactions' => $bookTransactions,
            'statementBalance' => $bankAccount->current_balance,
            'bookBalance' => $bankAccount->account ? $bankAccount->account->balance : 0,
        ]);
    }

    public function completeReconciliation(Request $request, BankAccount $bankAccount)
    {
        $request->validate([
            'reconcile_date' => 'required|date',
            'statement_balance' => 'required|numeric',
            'cleared_transactions' => 'required|array',
        ]);

        DB::transaction(function () use ($request, $bankAccount) {
            // Mark selected transactions as reconciled
            BankTransaction::where('bank_account_id', $bankAccount->id)
                ->whereIn('id', $request->cleared_transactions)
                ->update(['is_reconciled' => true]);

            // Update bank account reconciliation info
            $bankAccount->update([
                'last_reconciled_at' => $request->reconcile_date,
                'last_reconciled_balance' => $request->statement_balance,
            ]);

            // Create reconciliation record
            BankReconciliation::create([
                'bank_account_id' => $bankAccount->id,
                'statement_date' => $request->reconcile_date,
                'statement_balance' => $request->statement_balance,
                'gl_balance' => $bankAccount->account ? $bankAccount->account->balance : 0,
                'difference' => 0,
                'status' => 'completed',
                'completed_at' => now(),
                'completed_by' => auth()->id(),
            ]);
        });

        return redirect()->route('accounting.bank-accounts.show', $bankAccount)
            ->with('success', 'Reconciliation completed successfully.');
    }
}
