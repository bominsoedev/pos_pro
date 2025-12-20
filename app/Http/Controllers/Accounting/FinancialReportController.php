<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\JournalEntryLine;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinancialReportController extends Controller
{
    public function balanceSheet(Request $request)
    {
        $asOfDate = $request->as_of_date ?? now()->format('Y-m-d');

        // Get all accounts with balances
        $accounts = Account::where('is_active', true)
            ->whereIn('type', ['asset', 'liability', 'equity'])
            ->orderBy('code')
            ->get()
            ->map(function ($account) use ($asOfDate) {
                $balance = $account->getBalanceAsOf($asOfDate);
                return [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'name_mm' => $account->name_mm,
                    'type' => $account->type,
                    'subtype' => $account->subtype,
                    'balance' => $balance,
                ];
            });

        // Group by type
        $assets = $accounts->where('type', 'asset');
        $liabilities = $accounts->where('type', 'liability');
        $equity = $accounts->where('type', 'equity');

        // Calculate totals
        $totalAssets = $assets->sum('balance');
        $totalLiabilities = $liabilities->sum('balance');
        $totalEquity = $equity->sum('balance');

        // Calculate retained earnings (net income from income/expense accounts)
        $retainedEarnings = $this->calculateNetIncome(null, $asOfDate);
        $totalEquity += $retainedEarnings;

        return Inertia::render('accounting/reports/balance-sheet', [
            'assets' => $assets->values(),
            'liabilities' => $liabilities->values(),
            'equity' => $equity->values(),
            'totalAssets' => $totalAssets,
            'totalLiabilities' => $totalLiabilities,
            'totalEquity' => $totalEquity,
            'retainedEarnings' => $retainedEarnings,
            'isBalanced' => bccomp($totalAssets, $totalLiabilities + $totalEquity, 2) === 0,
            'asOfDate' => $asOfDate,
        ]);
    }

    public function incomeStatement(Request $request)
    {
        $dateFrom = $request->date_from ?? now()->startOfMonth()->format('Y-m-d');
        $dateTo = $request->date_to ?? now()->format('Y-m-d');

        // Get income accounts
        $incomeAccounts = Account::where('is_active', true)
            ->where('type', 'income')
            ->orderBy('code')
            ->get()
            ->map(function ($account) use ($dateFrom, $dateTo) {
                $credits = $account->getCreditBalance($dateFrom, $dateTo);
                $debits = $account->getDebitBalance($dateFrom, $dateTo);
                return [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'name_mm' => $account->name_mm,
                    'subtype' => $account->subtype,
                    'amount' => $credits - $debits,
                ];
            });

        // Get expense accounts
        $expenseAccounts = Account::where('is_active', true)
            ->where('type', 'expense')
            ->orderBy('code')
            ->get()
            ->map(function ($account) use ($dateFrom, $dateTo) {
                $debits = $account->getDebitBalance($dateFrom, $dateTo);
                $credits = $account->getCreditBalance($dateFrom, $dateTo);
                return [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'name_mm' => $account->name_mm,
                    'subtype' => $account->subtype,
                    'amount' => $debits - $credits,
                ];
            });

        // Group by subtype
        $salesRevenue = $incomeAccounts->where('subtype', 'sales');
        $otherIncome = $incomeAccounts->where('subtype', 'other_income');
        $costOfGoodsSold = $expenseAccounts->where('subtype', 'cost_of_goods_sold');
        $operatingExpenses = $expenseAccounts->where('subtype', 'operating_expense');
        $payrollExpenses = $expenseAccounts->where('subtype', 'payroll');
        $otherExpenses = $expenseAccounts->where('subtype', 'other_expense');

        $totalRevenue = $incomeAccounts->sum('amount');
        $totalCogs = $costOfGoodsSold->sum('amount');
        $grossProfit = $totalRevenue - $totalCogs;
        $totalOperatingExpenses = $operatingExpenses->sum('amount') + $payrollExpenses->sum('amount');
        $operatingIncome = $grossProfit - $totalOperatingExpenses;
        $totalOtherExpenses = $otherExpenses->sum('amount');
        $totalOtherIncome = $otherIncome->sum('amount');
        $netIncome = $operatingIncome + $totalOtherIncome - $totalOtherExpenses;

        return Inertia::render('accounting/reports/income-statement', [
            'salesRevenue' => $salesRevenue->values(),
            'otherIncome' => $otherIncome->values(),
            'costOfGoodsSold' => $costOfGoodsSold->values(),
            'operatingExpenses' => $operatingExpenses->values(),
            'payrollExpenses' => $payrollExpenses->values(),
            'otherExpenses' => $otherExpenses->values(),
            'totalRevenue' => $totalRevenue,
            'totalCogs' => $totalCogs,
            'grossProfit' => $grossProfit,
            'totalOperatingExpenses' => $totalOperatingExpenses,
            'operatingIncome' => $operatingIncome,
            'totalOtherIncome' => $totalOtherIncome,
            'totalOtherExpenses' => $totalOtherExpenses,
            'netIncome' => $netIncome,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]);
    }

    public function cashFlow(Request $request)
    {
        $dateFrom = $request->date_from ?? now()->startOfMonth()->format('Y-m-d');
        $dateTo = $request->date_to ?? now()->format('Y-m-d');

        // Get cash and bank accounts
        $cashAccounts = Account::where('is_active', true)
            ->whereIn('subtype', ['cash', 'bank'])
            ->get();

        // Opening cash balance
        $openingCashBalance = 0;
        foreach ($cashAccounts as $account) {
            $openingCashBalance += $account->opening_balance;
            $priorLines = $account->journalEntryLines()
                ->whereHas('journalEntry', function ($q) use ($dateFrom) {
                    $q->where('status', 'posted')
                        ->where('entry_date', '<', $dateFrom);
                })->get();
            $openingCashBalance += $priorLines->sum('debit') - $priorLines->sum('credit');
        }

        // Get all cash transactions in period
        $cashLines = JournalEntryLine::whereIn('account_id', $cashAccounts->pluck('id'))
            ->whereHas('journalEntry', function ($q) use ($dateFrom, $dateTo) {
                $q->where('status', 'posted')
                    ->whereBetween('entry_date', [$dateFrom, $dateTo]);
            })
            ->with(['journalEntry', 'account'])
            ->get();

        // Calculate cash movements by source
        $operatingActivities = [];
        $investingActivities = [];
        $financingActivities = [];

        foreach ($cashLines as $line) {
            $entry = $line->journalEntry;
            $amount = $line->debit - $line->credit;
            
            // Categorize based on journal entry source
            switch ($entry->source) {
                case 'sales':
                case 'expense':
                    $operatingActivities[] = [
                        'description' => $entry->description,
                        'amount' => $amount,
                        'date' => $entry->entry_date,
                    ];
                    break;
                case 'purchase':
                    $investingActivities[] = [
                        'description' => $entry->description,
                        'amount' => $amount,
                        'date' => $entry->entry_date,
                    ];
                    break;
                default:
                    // Check other account types in the entry
                    $otherLines = $entry->lines()->where('account_id', '!=', $line->account_id)->first();
                    if ($otherLines) {
                        $otherAccount = $otherLines->account;
                        if ($otherAccount->subtype === 'fixed_asset') {
                            $investingActivities[] = [
                                'description' => $entry->description,
                                'amount' => $amount,
                                'date' => $entry->entry_date,
                            ];
                        } elseif (in_array($otherAccount->type, ['liability', 'equity'])) {
                            $financingActivities[] = [
                                'description' => $entry->description,
                                'amount' => $amount,
                                'date' => $entry->entry_date,
                            ];
                        } else {
                            $operatingActivities[] = [
                                'description' => $entry->description,
                                'amount' => $amount,
                                'date' => $entry->entry_date,
                            ];
                        }
                    }
            }
        }

        $totalOperating = collect($operatingActivities)->sum('amount');
        $totalInvesting = collect($investingActivities)->sum('amount');
        $totalFinancing = collect($financingActivities)->sum('amount');
        $netChange = $totalOperating + $totalInvesting + $totalFinancing;
        $closingCashBalance = $openingCashBalance + $netChange;

        return Inertia::render('accounting/reports/cash-flow', [
            'operatingActivities' => $operatingActivities,
            'investingActivities' => $investingActivities,
            'financingActivities' => $financingActivities,
            'totalOperating' => $totalOperating,
            'totalInvesting' => $totalInvesting,
            'totalFinancing' => $totalFinancing,
            'netChange' => $netChange,
            'openingCashBalance' => $openingCashBalance,
            'closingCashBalance' => $closingCashBalance,
            'dateFrom' => $dateFrom,
            'dateTo' => $dateTo,
        ]);
    }

    private function calculateNetIncome($dateFrom, $dateTo): float
    {
        $incomeAccounts = Account::where('type', 'income')->get();
        $expenseAccounts = Account::where('type', 'expense')->get();

        $totalIncome = 0;
        foreach ($incomeAccounts as $account) {
            $credits = $account->getCreditBalance($dateFrom, $dateTo);
            $debits = $account->getDebitBalance($dateFrom, $dateTo);
            $totalIncome += $credits - $debits;
        }

        $totalExpenses = 0;
        foreach ($expenseAccounts as $account) {
            $debits = $account->getDebitBalance($dateFrom, $dateTo);
            $credits = $account->getCreditBalance($dateFrom, $dateTo);
            $totalExpenses += $debits - $credits;
        }

        return $totalIncome - $totalExpenses;
    }
}
