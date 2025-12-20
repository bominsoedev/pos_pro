<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\FiscalYear;
use App\Models\JournalEntry;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FiscalYearController extends Controller
{
    public function index()
    {
        $fiscalYears = FiscalYear::with('closedBy')
            ->orderBy('start_date', 'desc')
            ->get();

        $currentYear = FiscalYear::where('is_closed', false)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->first();

        return Inertia::render('accounting/fiscal-years/index', [
            'fiscalYears' => $fiscalYears,
            'currentYear' => $currentYear,
        ]);
    }

    public function create()
    {
        $lastYear = FiscalYear::orderBy('end_date', 'desc')->first();
        
        $suggestedStart = $lastYear 
            ? $lastYear->end_date->addDay() 
            : Carbon::now()->startOfYear();
        
        $suggestedEnd = $suggestedStart->copy()->addYear()->subDay();

        return Inertia::render('accounting/fiscal-years/create', [
            'suggestedStart' => $suggestedStart->format('Y-m-d'),
            'suggestedEnd' => $suggestedEnd->format('Y-m-d'),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        // Check for overlapping fiscal years
        $overlapping = FiscalYear::where(function ($q) use ($validated) {
            $q->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']]);
        })->exists();

        if ($overlapping) {
            return back()->withErrors(['start_date' => 'This period overlaps with an existing fiscal year.']);
        }

        FiscalYear::create($validated);

        return redirect()->route('accounting.fiscal-years.index')
            ->with('success', 'Fiscal year created successfully.');
    }

    public function close(FiscalYear $fiscalYear)
    {
        if ($fiscalYear->is_closed) {
            return back()->with('error', 'This fiscal year is already closed.');
        }

        // Get summary data for the closing page
        $revenueAccounts = Account::where('type', 'income')->where('is_active', true)->get();
        $expenseAccounts = Account::where('type', 'expense')->where('is_active', true)->get();
        $retainedEarningsAccount = Account::where('subtype', 'retained_earnings')->first();

        $totalRevenue = 0;
        $totalExpenses = 0;
        $revenueDetails = [];
        $expenseDetails = [];

        foreach ($revenueAccounts as $account) {
            $balance = $this->getAccountBalanceForPeriod($account, $fiscalYear->start_date, $fiscalYear->end_date);
            if ($balance != 0) {
                $revenueDetails[] = [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'balance' => $balance,
                ];
                $totalRevenue += $balance;
            }
        }

        foreach ($expenseAccounts as $account) {
            $balance = $this->getAccountBalanceForPeriod($account, $fiscalYear->start_date, $fiscalYear->end_date);
            if ($balance != 0) {
                $expenseDetails[] = [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'balance' => $balance,
                ];
                $totalExpenses += $balance;
            }
        }

        $netIncome = $totalRevenue - $totalExpenses;

        return Inertia::render('accounting/fiscal-years/close', [
            'fiscalYear' => $fiscalYear,
            'revenueDetails' => $revenueDetails,
            'expenseDetails' => $expenseDetails,
            'totalRevenue' => $totalRevenue,
            'totalExpenses' => $totalExpenses,
            'netIncome' => $netIncome,
            'retainedEarningsAccount' => $retainedEarningsAccount,
        ]);
    }

    public function processClose(Request $request, FiscalYear $fiscalYear)
    {
        if ($fiscalYear->is_closed) {
            return back()->with('error', 'This fiscal year is already closed.');
        }

        $retainedEarningsAccount = Account::where('subtype', 'retained_earnings')->first();
        if (!$retainedEarningsAccount) {
            return back()->with('error', 'Retained Earnings account not found. Please create one first.');
        }

        DB::transaction(function () use ($fiscalYear, $retainedEarningsAccount) {
            $revenueAccounts = Account::where('type', 'income')->where('is_active', true)->get();
            $expenseAccounts = Account::where('type', 'expense')->where('is_active', true)->get();

            $closingLines = [];
            $totalRevenue = 0;
            $totalExpenses = 0;

            // Close revenue accounts (debit to zero out)
            foreach ($revenueAccounts as $account) {
                $balance = $this->getAccountBalanceForPeriod($account, $fiscalYear->start_date, $fiscalYear->end_date);
                if ($balance != 0) {
                    $closingLines[] = [
                        'account_id' => $account->id,
                        'description' => 'Closing entry - ' . $account->name,
                        'debit' => $balance,
                        'credit' => 0,
                    ];
                    $totalRevenue += $balance;
                }
            }

            // Close expense accounts (credit to zero out)
            foreach ($expenseAccounts as $account) {
                $balance = $this->getAccountBalanceForPeriod($account, $fiscalYear->start_date, $fiscalYear->end_date);
                if ($balance != 0) {
                    $closingLines[] = [
                        'account_id' => $account->id,
                        'description' => 'Closing entry - ' . $account->name,
                        'debit' => 0,
                        'credit' => $balance,
                    ];
                    $totalExpenses += $balance;
                }
            }

            $netIncome = $totalRevenue - $totalExpenses;

            // Transfer net income to retained earnings
            if ($netIncome > 0) {
                $closingLines[] = [
                    'account_id' => $retainedEarningsAccount->id,
                    'description' => 'Net income for ' . $fiscalYear->name,
                    'debit' => 0,
                    'credit' => $netIncome,
                ];
            } else {
                $closingLines[] = [
                    'account_id' => $retainedEarningsAccount->id,
                    'description' => 'Net loss for ' . $fiscalYear->name,
                    'debit' => abs($netIncome),
                    'credit' => 0,
                ];
            }

            // Create closing journal entry
            if (count($closingLines) > 0) {
                $totalDebit = collect($closingLines)->sum('debit');
                $totalCredit = collect($closingLines)->sum('credit');

                $entry = JournalEntry::create([
                    'entry_number' => JournalEntry::generateEntryNumber(),
                    'entry_date' => $fiscalYear->end_date,
                    'reference' => 'CLOSING-' . $fiscalYear->name,
                    'description' => 'Year-end closing entry for ' . $fiscalYear->name,
                    'source' => 'adjustment',
                    'total_debit' => $totalDebit,
                    'total_credit' => $totalCredit,
                    'created_by' => auth()->id(),
                    'status' => 'posted',
                    'posted_by' => auth()->id(),
                    'posted_at' => now(),
                ]);

                foreach ($closingLines as $index => $line) {
                    $entry->lines()->create([
                        'account_id' => $line['account_id'],
                        'description' => $line['description'],
                        'debit' => $line['debit'],
                        'credit' => $line['credit'],
                        'line_order' => $index,
                    ]);
                }

                $fiscalYear->update([
                    'closing_entry_id' => $entry->id,
                ]);
            }

            // Mark fiscal year as closed
            $fiscalYear->update([
                'is_closed' => true,
                'closed_at' => now(),
                'closed_by' => auth()->id(),
            ]);
        });

        return redirect()->route('accounting.fiscal-years.index')
            ->with('success', 'Fiscal year closed successfully. Closing entries have been posted.');
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

        // For income accounts, credit increases balance
        // For expense accounts, debit increases balance
        if ($account->type === 'income') {
            return $credits - $debits;
        }

        return $debits - $credits;
    }
}
