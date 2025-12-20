<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\JournalEntryLine;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GeneralLedgerController extends Controller
{
    public function index(Request $request)
    {
        $accounts = Account::where('is_active', true)
            ->orderBy('code')
            ->get()
            ->map(fn($a) => [
                'id' => $a->id,
                'code' => $a->code,
                'name' => $a->name,
                'type' => $a->type,
                'display_name' => $a->display_name,
            ]);

        $selectedAccount = null;
        $ledgerEntries = collect();
        $openingBalance = 0;
        $runningBalance = 0;

        if ($request->account_id) {
            $selectedAccount = Account::find($request->account_id);
            
            if ($selectedAccount) {
                $query = JournalEntryLine::with(['journalEntry'])
                    ->where('account_id', $request->account_id)
                    ->whereHas('journalEntry', function ($q) use ($request) {
                        $q->where('status', 'posted');
                        if ($request->date_from) {
                            $q->where('entry_date', '>=', $request->date_from);
                        }
                        if ($request->date_to) {
                            $q->where('entry_date', '<=', $request->date_to);
                        }
                    });

                // Calculate opening balance (before date_from)
                if ($request->date_from) {
                    $openingBalance = $selectedAccount->opening_balance;
                    $priorLines = JournalEntryLine::where('account_id', $request->account_id)
                        ->whereHas('journalEntry', function ($q) use ($request) {
                            $q->where('status', 'posted')
                                ->where('entry_date', '<', $request->date_from);
                        })->get();

                    $priorDebits = $priorLines->sum('debit');
                    $priorCredits = $priorLines->sum('credit');

                    if ($selectedAccount->isDebitAccount()) {
                        $openingBalance += $priorDebits - $priorCredits;
                    } else {
                        $openingBalance += $priorCredits - $priorDebits;
                    }
                } else {
                    $openingBalance = $selectedAccount->opening_balance;
                }

                $ledgerEntries = $query->orderBy('created_at')->get()->map(function ($line) use ($selectedAccount, &$runningBalance, $openingBalance) {
                    if ($runningBalance === 0) {
                        $runningBalance = $openingBalance;
                    }
                    
                    if ($selectedAccount->isDebitAccount()) {
                        $runningBalance += $line->debit - $line->credit;
                    } else {
                        $runningBalance += $line->credit - $line->debit;
                    }

                    return [
                        'id' => $line->id,
                        'date' => $line->journalEntry->entry_date,
                        'entry_number' => $line->journalEntry->entry_number,
                        'description' => $line->description ?? $line->journalEntry->description,
                        'reference' => $line->journalEntry->reference,
                        'debit' => $line->debit,
                        'credit' => $line->credit,
                        'balance' => $runningBalance,
                    ];
                });
            }
        }

        return Inertia::render('accounting/general-ledger/index', [
            'accounts' => $accounts,
            'selectedAccount' => $selectedAccount,
            'ledgerEntries' => $ledgerEntries,
            'openingBalance' => $openingBalance,
            'closingBalance' => $runningBalance ?: $openingBalance,
            'filters' => $request->only(['account_id', 'date_from', 'date_to']),
        ]);
    }

    public function trialBalance(Request $request)
    {
        $dateFrom = $request->date_from;
        $dateTo = $request->date_to ?? now()->format('Y-m-d');

        $accounts = Account::where('is_active', true)
            ->orderBy('code')
            ->get()
            ->map(function ($account) use ($dateFrom, $dateTo) {
                $debit = $account->getDebitBalance($dateFrom, $dateTo);
                $credit = $account->getCreditBalance($dateFrom, $dateTo);
                
                // Add opening balance for balance sheet accounts
                if (in_array($account->type, ['asset', 'liability', 'equity'])) {
                    if ($account->isDebitAccount()) {
                        $debit += $account->opening_balance;
                    } else {
                        $credit += $account->opening_balance;
                    }
                }

                $balance = $account->isDebitAccount() 
                    ? $debit - $credit 
                    : $credit - $debit;

                return [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'type' => $account->type,
                    'debit' => $debit,
                    'credit' => $credit,
                    'balance' => $balance,
                    'debit_balance' => $balance > 0 ? $balance : 0,
                    'credit_balance' => $balance < 0 ? abs($balance) : 0,
                ];
            })
            ->filter(fn($a) => $a['debit'] > 0 || $a['credit'] > 0 || $a['balance'] != 0);

        $totals = [
            'debit' => $accounts->sum('debit_balance'),
            'credit' => $accounts->sum('credit_balance'),
        ];

        return Inertia::render('accounting/reports/trial-balance', [
            'accounts' => $accounts->values(),
            'totals' => $totals,
            'isBalanced' => bccomp($totals['debit'], $totals['credit'], 2) === 0,
            'filters' => $request->only(['date_from', 'date_to']),
            'dateTo' => $dateTo,
        ]);
    }
}
