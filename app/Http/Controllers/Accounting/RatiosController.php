<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\JournalEntry;
use App\Models\Order;
use App\Models\Payable;
use App\Models\Receivable;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RatiosController extends Controller
{
    public function index(Request $request)
    {
        $asOfDate = $request->as_of_date ? Carbon::parse($request->as_of_date) : Carbon::today();
        $startOfYear = $asOfDate->copy()->startOfYear();

        // Get account balances
        $currentAssets = $this->getAccountTypeBalance(['cash', 'bank', 'accounts_receivable', 'inventory', 'prepaid'], $asOfDate);
        $currentLiabilities = $this->getAccountTypeBalance(['accounts_payable', 'credit_card', 'current_liability'], $asOfDate);
        $totalAssets = $this->getAccountCategoryBalance('asset', $asOfDate);
        $totalLiabilities = $this->getAccountCategoryBalance('liability', $asOfDate);
        $totalEquity = $this->getAccountCategoryBalance('equity', $asOfDate);
        
        // Get inventory for quick ratio
        $inventory = $this->getAccountTypeBalance(['inventory'], $asOfDate);
        
        // Get revenue and expenses YTD
        $revenue = $this->getAccountCategoryTotal('income', $startOfYear, $asOfDate);
        $cogs = $this->getAccountTypeTotal(['cost_of_goods_sold'], $startOfYear, $asOfDate);
        $operatingExpenses = $this->getAccountTypeTotal(['operating_expense', 'payroll', 'other_expense'], $startOfYear, $asOfDate);
        $totalExpenses = $cogs + $operatingExpenses;
        $netIncome = $revenue - $totalExpenses;
        $grossProfit = $revenue - $cogs;

        // Calculate ratios
        $ratios = [
            'liquidity' => [
                'current_ratio' => $currentLiabilities > 0 ? round($currentAssets / $currentLiabilities, 2) : null,
                'quick_ratio' => $currentLiabilities > 0 ? round(($currentAssets - $inventory) / $currentLiabilities, 2) : null,
                'cash_ratio' => $currentLiabilities > 0 ? round($this->getAccountTypeBalance(['cash', 'bank'], $asOfDate) / $currentLiabilities, 2) : null,
            ],
            'profitability' => [
                'gross_profit_margin' => $revenue > 0 ? round(($grossProfit / $revenue) * 100, 1) : null,
                'net_profit_margin' => $revenue > 0 ? round(($netIncome / $revenue) * 100, 1) : null,
                'return_on_assets' => $totalAssets > 0 ? round(($netIncome / $totalAssets) * 100, 1) : null,
                'return_on_equity' => $totalEquity > 0 ? round(($netIncome / $totalEquity) * 100, 1) : null,
            ],
            'leverage' => [
                'debt_ratio' => $totalAssets > 0 ? round(($totalLiabilities / $totalAssets) * 100, 1) : null,
                'debt_to_equity' => $totalEquity > 0 ? round($totalLiabilities / $totalEquity, 2) : null,
                'equity_ratio' => $totalAssets > 0 ? round(($totalEquity / $totalAssets) * 100, 1) : null,
            ],
            'efficiency' => [
                'ar_turnover' => $this->calculateARTurnover($startOfYear, $asOfDate),
                'ap_turnover' => $this->calculateAPTurnover($startOfYear, $asOfDate),
                'ar_days' => $this->calculateARDays($startOfYear, $asOfDate),
                'ap_days' => $this->calculateAPDays($startOfYear, $asOfDate),
            ],
        ];

        // Get historical data for trends (last 6 months)
        $trends = $this->getRatioTrends(6);

        // Summary data
        $summary = [
            'current_assets' => $currentAssets,
            'current_liabilities' => $currentLiabilities,
            'total_assets' => $totalAssets,
            'total_liabilities' => $totalLiabilities,
            'total_equity' => $totalEquity,
            'revenue_ytd' => $revenue,
            'expenses_ytd' => $totalExpenses,
            'net_income_ytd' => $netIncome,
            'gross_profit_ytd' => $grossProfit,
        ];

        return Inertia::render('accounting/reports/ratios', [
            'ratios' => $ratios,
            'summary' => $summary,
            'trends' => $trends,
            'asOfDate' => $asOfDate->format('Y-m-d'),
        ]);
    }

    private function getAccountTypeBalance(array $subtypes, $asOfDate): float
    {
        $accounts = Account::whereIn('subtype', $subtypes)->where('is_active', true)->get();
        $total = 0;

        foreach ($accounts as $account) {
            $total += $account->getBalanceAsOf($asOfDate);
        }

        return $total;
    }

    private function getAccountCategoryBalance(string $type, $asOfDate): float
    {
        $accounts = Account::where('type', $type)->where('is_active', true)->get();
        $total = 0;

        foreach ($accounts as $account) {
            $total += $account->getBalanceAsOf($asOfDate);
        }

        return abs($total);
    }

    private function getAccountTypeTotal(array $subtypes, $startDate, $endDate): float
    {
        $accountIds = Account::whereIn('subtype', $subtypes)->pluck('id');
        
        $total = 0;
        $entries = JournalEntry::where('status', 'posted')
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->with(['lines' => function ($q) use ($accountIds) {
                $q->whereIn('account_id', $accountIds);
            }])
            ->get();

        foreach ($entries as $entry) {
            foreach ($entry->lines as $line) {
                $total += $line->debit - $line->credit;
            }
        }

        return abs($total);
    }

    private function getAccountCategoryTotal(string $type, $startDate, $endDate): float
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

        return abs($total);
    }

    private function calculateARTurnover($startDate, $endDate): ?float
    {
        $revenue = $this->getAccountCategoryTotal('income', $startDate, $endDate);
        $avgAR = Receivable::whereNotIn('status', ['void', 'bad_debt'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->avg('total_amount') ?? 0;

        if ($avgAR <= 0) {
            return null;
        }

        return round($revenue / $avgAR, 2);
    }

    private function calculateAPTurnover($startDate, $endDate): ?float
    {
        $purchases = $this->getAccountTypeTotal(['cost_of_goods_sold', 'inventory'], $startDate, $endDate);
        $avgAP = Payable::whereNotIn('status', ['void'])
            ->whereBetween('created_at', [$startDate, $endDate])
            ->avg('total_amount') ?? 0;

        if ($avgAP <= 0) {
            return null;
        }

        return round($purchases / $avgAP, 2);
    }

    private function calculateARDays($startDate, $endDate): ?int
    {
        $turnover = $this->calculateARTurnover($startDate, $endDate);
        if (!$turnover || $turnover <= 0) {
            return null;
        }

        $days = $startDate->diffInDays($endDate);
        return round($days / $turnover);
    }

    private function calculateAPDays($startDate, $endDate): ?int
    {
        $turnover = $this->calculateAPTurnover($startDate, $endDate);
        if (!$turnover || $turnover <= 0) {
            return null;
        }

        $days = $startDate->diffInDays($endDate);
        return round($days / $turnover);
    }

    private function getRatioTrends(int $months): array
    {
        $trends = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i)->endOfMonth();
            $startOfMonth = $date->copy()->startOfMonth();

            $currentAssets = $this->getAccountTypeBalance(['cash', 'bank', 'accounts_receivable', 'inventory', 'prepaid'], $date);
            $currentLiabilities = $this->getAccountTypeBalance(['accounts_payable', 'credit_card', 'current_liability'], $date);
            
            $revenue = $this->getAccountCategoryTotal('income', $startOfMonth, $date);
            $expenses = $this->getAccountCategoryTotal('expense', $startOfMonth, $date);
            $netIncome = $revenue - $expenses;

            $trends[] = [
                'month' => $date->format('M Y'),
                'current_ratio' => $currentLiabilities > 0 ? round($currentAssets / $currentLiabilities, 2) : 0,
                'profit_margin' => $revenue > 0 ? round(($netIncome / $revenue) * 100, 1) : 0,
            ];
        }

        return $trends;
    }
}
