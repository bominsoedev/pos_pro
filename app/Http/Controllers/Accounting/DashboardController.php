<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\BankAccount;
use App\Models\JournalEntry;
use App\Models\Payable;
use App\Models\Receivable;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $startOfMonth = Carbon::now()->startOfMonth();
        $endOfMonth = Carbon::now()->endOfMonth();
        $startOfLastMonth = Carbon::now()->subMonth()->startOfMonth();
        $endOfLastMonth = Carbon::now()->subMonth()->endOfMonth();

        // Cash Flow Overview
        $cashAccounts = Account::whereIn('subtype', ['cash', 'bank'])->pluck('id');
        
        $cashFlowToday = $this->getCashFlow($cashAccounts, $today, $today);
        $cashFlowThisMonth = $this->getCashFlow($cashAccounts, $startOfMonth, $today);
        $cashFlowLastMonth = $this->getCashFlow($cashAccounts, $startOfLastMonth, $endOfLastMonth);

        // Revenue & Expenses This Month
        $revenueThisMonth = $this->getAccountTypeTotal('income', $startOfMonth, $today);
        $expensesThisMonth = $this->getAccountTypeTotal('expense', $startOfMonth, $today);
        $revenueLastMonth = $this->getAccountTypeTotal('income', $startOfLastMonth, $endOfLastMonth);
        $expensesLastMonth = $this->getAccountTypeTotal('expense', $startOfLastMonth, $endOfLastMonth);

        // Monthly Revenue vs Expenses (Last 6 months)
        $monthlyData = $this->getMonthlyRevenueExpenses(6);

        // Accounts Receivable Summary
        $arSummary = [
            'total' => Receivable::whereNotIn('status', ['paid', 'void', 'bad_debt'])->sum('balance_due'),
            'overdue' => Receivable::where('due_date', '<', $today)
                ->whereNotIn('status', ['paid', 'void', 'bad_debt'])
                ->sum('balance_due'),
            'current' => Receivable::where('due_date', '>=', $today)
                ->whereNotIn('status', ['paid', 'void', 'bad_debt'])
                ->sum('balance_due'),
            'count' => Receivable::whereNotIn('status', ['paid', 'void', 'bad_debt'])->count(),
        ];

        // Accounts Payable Summary
        $apSummary = [
            'total' => Payable::whereNotIn('status', ['paid', 'void'])->sum('balance_due'),
            'overdue' => Payable::where('due_date', '<', $today)
                ->whereNotIn('status', ['paid', 'void'])
                ->sum('balance_due'),
            'current' => Payable::where('due_date', '>=', $today)
                ->whereNotIn('status', ['paid', 'void'])
                ->sum('balance_due'),
            'count' => Payable::whereNotIn('status', ['paid', 'void'])->count(),
        ];

        // Bank Account Balances
        $bankAccounts = BankAccount::where('is_active', true)
            ->orderBy('bank_name')
            ->get(['id', 'name', 'account_name', 'bank_name', 'current_balance', 'currency']);

        // Recent Journal Entries
        $recentEntries = JournalEntry::with('createdBy')
            ->where('status', 'posted')
            ->orderBy('entry_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        // Top Expense Categories This Month
        $topExpenses = $this->getTopExpenseCategories($startOfMonth, $today, 5);

        // Cash Balance
        $totalCashBalance = Account::whereIn('subtype', ['cash', 'bank'])
            ->where('is_active', true)
            ->get()
            ->sum(function ($account) {
                return $account->balance;
            });

        return Inertia::render('accounting/dashboard', [
            'cashFlow' => [
                'today' => $cashFlowToday,
                'thisMonth' => $cashFlowThisMonth,
                'lastMonth' => $cashFlowLastMonth,
            ],
            'revenue' => [
                'thisMonth' => $revenueThisMonth,
                'lastMonth' => $revenueLastMonth,
                'change' => $revenueLastMonth > 0 
                    ? round((($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth) * 100, 1) 
                    : 0,
            ],
            'expenses' => [
                'thisMonth' => $expensesThisMonth,
                'lastMonth' => $expensesLastMonth,
                'change' => $expensesLastMonth > 0 
                    ? round((($expensesThisMonth - $expensesLastMonth) / $expensesLastMonth) * 100, 1) 
                    : 0,
            ],
            'netIncome' => $revenueThisMonth - $expensesThisMonth,
            'monthlyData' => $monthlyData,
            'arSummary' => $arSummary,
            'apSummary' => $apSummary,
            'bankAccounts' => $bankAccounts,
            'recentEntries' => $recentEntries,
            'topExpenses' => $topExpenses,
            'totalCashBalance' => $totalCashBalance,
        ]);
    }

    private function getCashFlow($accountIds, $startDate, $endDate): array
    {
        $inflow = 0;
        $outflow = 0;

        $entries = JournalEntry::where('status', 'posted')
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->with(['lines' => function ($q) use ($accountIds) {
                $q->whereIn('account_id', $accountIds);
            }])
            ->get();

        foreach ($entries as $entry) {
            foreach ($entry->lines as $line) {
                $inflow += $line->debit;
                $outflow += $line->credit;
            }
        }

        return [
            'inflow' => $inflow,
            'outflow' => $outflow,
            'net' => $inflow - $outflow,
        ];
    }

    private function getAccountTypeTotal(string $type, $startDate, $endDate): float
    {
        $accountIds = Account::where('type', $type)->pluck('id');
        
        $total = 0;
        $entries = JournalEntry::where('status', 'posted')
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->with(['lines' => function ($q) use ($accountIds) {
                $q->whereIn('account_id', $accountIds);
            }])
            ->get();

        foreach ($entries as $entry) {
            foreach ($entry->lines as $line) {
                if ($type === 'income') {
                    $total += $line->credit - $line->debit;
                } else {
                    $total += $line->debit - $line->credit;
                }
            }
        }

        return $total;
    }

    private function getMonthlyRevenueExpenses(int $months): array
    {
        $data = [];
        
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();
            
            $data[] = [
                'month' => $date->format('M Y'),
                'revenue' => $this->getAccountTypeTotal('income', $startOfMonth, $endOfMonth),
                'expenses' => $this->getAccountTypeTotal('expense', $startOfMonth, $endOfMonth),
            ];
        }

        return $data;
    }

    private function getTopExpenseCategories($startDate, $endDate, int $limit): array
    {
        $expenseAccounts = Account::where('type', 'expense')
            ->where('is_active', true)
            ->get();

        $expenses = [];
        foreach ($expenseAccounts as $account) {
            $total = $account->journalEntryLines()
                ->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                    $q->where('status', 'posted')
                        ->whereBetween('entry_date', [$startDate, $endDate]);
                })
                ->sum('debit') - $account->journalEntryLines()
                ->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                    $q->where('status', 'posted')
                        ->whereBetween('entry_date', [$startDate, $endDate]);
                })
                ->sum('credit');

            if ($total > 0) {
                $expenses[] = [
                    'name' => $account->name,
                    'amount' => $total,
                ];
            }
        }

        usort($expenses, fn($a, $b) => $b['amount'] <=> $a['amount']);
        
        return array_slice($expenses, 0, $limit);
    }
}
