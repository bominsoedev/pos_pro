<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\JournalEntry;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class ExportController extends Controller
{
    /**
     * Export Trial Balance to CSV
     */
    public function trialBalanceCsv(Request $request)
    {
        $asOfDate = $request->as_of_date ? Carbon::parse($request->as_of_date) : Carbon::today();
        
        $accounts = Account::where('is_active', true)->orderBy('code')->get();
        
        $data = [];
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($accounts as $account) {
            $balance = $account->getBalanceAsOf($asOfDate);
            if ($balance == 0) continue;

            $debit = $account->isDebitAccount() && $balance > 0 ? $balance : ($balance < 0 ? abs($balance) : 0);
            $credit = !$account->isDebitAccount() && $balance > 0 ? $balance : ($account->isDebitAccount() && $balance < 0 ? abs($balance) : 0);

            if ($account->isDebitAccount()) {
                $debit = $balance > 0 ? $balance : 0;
                $credit = $balance < 0 ? abs($balance) : 0;
            } else {
                $credit = $balance > 0 ? $balance : 0;
                $debit = $balance < 0 ? abs($balance) : 0;
            }

            $data[] = [
                'Code' => $account->code,
                'Account Name' => $account->name,
                'Type' => ucfirst($account->type),
                'Debit' => $debit,
                'Credit' => $credit,
            ];

            $totalDebit += $debit;
            $totalCredit += $credit;
        }

        $data[] = [
            'Code' => '',
            'Account Name' => 'TOTAL',
            'Type' => '',
            'Debit' => $totalDebit,
            'Credit' => $totalCredit,
        ];

        return $this->downloadCsv($data, 'trial-balance-' . $asOfDate->format('Y-m-d') . '.csv');
    }

    /**
     * Export Balance Sheet to CSV
     */
    public function balanceSheetCsv(Request $request)
    {
        $asOfDate = $request->as_of_date ? Carbon::parse($request->as_of_date) : Carbon::today();
        
        $data = [];

        // Assets
        $data[] = ['Section' => 'ASSETS', 'Account' => '', 'Balance' => ''];
        $assetAccounts = Account::where('type', 'asset')->where('is_active', true)->orderBy('code')->get();
        $totalAssets = 0;
        foreach ($assetAccounts as $account) {
            $balance = $account->getBalanceAsOf($asOfDate);
            if ($balance != 0) {
                $data[] = ['Section' => '', 'Account' => $account->code . ' - ' . $account->name, 'Balance' => $balance];
                $totalAssets += $balance;
            }
        }
        $data[] = ['Section' => '', 'Account' => 'Total Assets', 'Balance' => $totalAssets];
        $data[] = ['Section' => '', 'Account' => '', 'Balance' => ''];

        // Liabilities
        $data[] = ['Section' => 'LIABILITIES', 'Account' => '', 'Balance' => ''];
        $liabilityAccounts = Account::where('type', 'liability')->where('is_active', true)->orderBy('code')->get();
        $totalLiabilities = 0;
        foreach ($liabilityAccounts as $account) {
            $balance = $account->getBalanceAsOf($asOfDate);
            if ($balance != 0) {
                $data[] = ['Section' => '', 'Account' => $account->code . ' - ' . $account->name, 'Balance' => $balance];
                $totalLiabilities += $balance;
            }
        }
        $data[] = ['Section' => '', 'Account' => 'Total Liabilities', 'Balance' => $totalLiabilities];
        $data[] = ['Section' => '', 'Account' => '', 'Balance' => ''];

        // Equity
        $data[] = ['Section' => 'EQUITY', 'Account' => '', 'Balance' => ''];
        $equityAccounts = Account::where('type', 'equity')->where('is_active', true)->orderBy('code')->get();
        $totalEquity = 0;
        foreach ($equityAccounts as $account) {
            $balance = $account->getBalanceAsOf($asOfDate);
            if ($balance != 0) {
                $data[] = ['Section' => '', 'Account' => $account->code . ' - ' . $account->name, 'Balance' => $balance];
                $totalEquity += $balance;
            }
        }
        $data[] = ['Section' => '', 'Account' => 'Total Equity', 'Balance' => $totalEquity];
        $data[] = ['Section' => '', 'Account' => '', 'Balance' => ''];
        $data[] = ['Section' => '', 'Account' => 'Total Liabilities & Equity', 'Balance' => $totalLiabilities + $totalEquity];

        return $this->downloadCsv($data, 'balance-sheet-' . $asOfDate->format('Y-m-d') . '.csv');
    }

    /**
     * Export Income Statement to CSV
     */
    public function incomeStatementCsv(Request $request)
    {
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

        $data = [];

        // Revenue
        $data[] = ['Section' => 'REVENUE', 'Account' => '', 'Amount' => ''];
        $revenueAccounts = Account::where('type', 'income')->where('is_active', true)->orderBy('code')->get();
        $totalRevenue = 0;
        foreach ($revenueAccounts as $account) {
            $balance = $this->getAccountBalanceForPeriod($account, $startDate, $endDate);
            if ($balance != 0) {
                $data[] = ['Section' => '', 'Account' => $account->code . ' - ' . $account->name, 'Amount' => $balance];
                $totalRevenue += $balance;
            }
        }
        $data[] = ['Section' => '', 'Account' => 'Total Revenue', 'Amount' => $totalRevenue];
        $data[] = ['Section' => '', 'Account' => '', 'Amount' => ''];

        // Expenses
        $data[] = ['Section' => 'EXPENSES', 'Account' => '', 'Amount' => ''];
        $expenseAccounts = Account::where('type', 'expense')->where('is_active', true)->orderBy('code')->get();
        $totalExpenses = 0;
        foreach ($expenseAccounts as $account) {
            $balance = $this->getAccountBalanceForPeriod($account, $startDate, $endDate);
            if ($balance != 0) {
                $data[] = ['Section' => '', 'Account' => $account->code . ' - ' . $account->name, 'Amount' => $balance];
                $totalExpenses += $balance;
            }
        }
        $data[] = ['Section' => '', 'Account' => 'Total Expenses', 'Amount' => $totalExpenses];
        $data[] = ['Section' => '', 'Account' => '', 'Amount' => ''];

        // Net Income
        $data[] = ['Section' => '', 'Account' => 'NET INCOME', 'Amount' => $totalRevenue - $totalExpenses];

        return $this->downloadCsv($data, 'income-statement-' . $startDate->format('Y-m-d') . '-to-' . $endDate->format('Y-m-d') . '.csv');
    }

    /**
     * Export General Ledger to CSV
     */
    public function generalLedgerCsv(Request $request)
    {
        $accountId = $request->account_id;
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

        if (!$accountId) {
            return back()->with('error', 'Account is required.');
        }

        $account = Account::findOrFail($accountId);

        $entries = $account->journalEntryLines()
            ->with(['journalEntry'])
            ->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'posted')
                    ->whereBetween('entry_date', [$startDate, $endDate]);
            })
            ->orderBy('created_at')
            ->get();

        $openingBalance = $account->getBalanceAsOf($startDate->copy()->subDay());

        $data = [];
        $data[] = ['Date' => 'Opening Balance', 'Entry' => '', 'Description' => '', 'Debit' => '', 'Credit' => '', 'Balance' => $openingBalance];

        $runningBalance = $openingBalance;
        foreach ($entries as $entry) {
            if ($account->isDebitAccount()) {
                $runningBalance += $entry->debit - $entry->credit;
            } else {
                $runningBalance += $entry->credit - $entry->debit;
            }

            $data[] = [
                'Date' => $entry->journalEntry->entry_date->format('Y-m-d'),
                'Entry' => $entry->journalEntry->entry_number,
                'Description' => $entry->description ?? $entry->journalEntry->description,
                'Debit' => $entry->debit > 0 ? $entry->debit : '',
                'Credit' => $entry->credit > 0 ? $entry->credit : '',
                'Balance' => $runningBalance,
            ];
        }

        $data[] = ['Date' => 'Closing Balance', 'Entry' => '', 'Description' => '', 'Debit' => '', 'Credit' => '', 'Balance' => $runningBalance];

        return $this->downloadCsv($data, 'general-ledger-' . $account->code . '-' . $startDate->format('Y-m-d') . '.csv');
    }

    /**
     * Export Journal Entries to CSV
     */
    public function journalEntriesCsv(Request $request)
    {
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

        $entries = JournalEntry::with(['lines.account', 'createdBy'])
            ->where('status', 'posted')
            ->whereBetween('entry_date', [$startDate, $endDate])
            ->orderBy('entry_date')
            ->orderBy('entry_number')
            ->get();

        $data = [];
        foreach ($entries as $entry) {
            foreach ($entry->lines as $line) {
                $data[] = [
                    'Date' => $entry->entry_date->format('Y-m-d'),
                    'Entry Number' => $entry->entry_number,
                    'Description' => $entry->description,
                    'Account Code' => $line->account->code,
                    'Account Name' => $line->account->name,
                    'Line Description' => $line->description,
                    'Debit' => $line->debit > 0 ? $line->debit : '',
                    'Credit' => $line->credit > 0 ? $line->credit : '',
                    'Reference' => $entry->reference,
                    'Source' => $entry->source,
                ];
            }
        }

        return $this->downloadCsv($data, 'journal-entries-' . $startDate->format('Y-m-d') . '-to-' . $endDate->format('Y-m-d') . '.csv');
    }

    /**
     * Helper to download CSV
     */
    private function downloadCsv(array $data, string $filename): Response
    {
        if (empty($data)) {
            $output = "No data available";
        } else {
            $headers = array_keys($data[0]);
            $output = implode(',', $headers) . "\n";

            foreach ($data as $row) {
                $values = array_map(function ($value) {
                    if (is_numeric($value)) {
                        return $value;
                    }
                    return '"' . str_replace('"', '""', $value) . '"';
                }, array_values($row));
                $output .= implode(',', $values) . "\n";
            }
        }

        return response($output, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    private function getAccountBalanceForPeriod(Account $account, $startDate, $endDate): float
    {
        $lines = $account->journalEntryLines()
            ->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'posted')
                    ->whereBetween('entry_date', [$startDate, $endDate]);
            })
            ->get();

        $debits = $lines->sum('debit');
        $credits = $lines->sum('credit');

        if ($account->type === 'income') {
            return $credits - $debits;
        }

        return $debits - $credits;
    }
}
