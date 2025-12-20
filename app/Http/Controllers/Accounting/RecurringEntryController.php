<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\RecurringJournalEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RecurringEntryController extends Controller
{
    public function index(Request $request)
    {
        $query = RecurringJournalEntry::with(['createdBy', 'lines.account']);

        if ($request->status === 'active') {
            $query->where('is_active', true);
        } elseif ($request->status === 'inactive') {
            $query->where('is_active', false);
        }

        $entries = $query->orderBy('next_run_date')
            ->paginate(20);

        // Get upcoming entries (next 7 days)
        $upcomingEntries = RecurringJournalEntry::where('is_active', true)
            ->whereBetween('next_run_date', [now(), now()->addDays(7)])
            ->orderBy('next_run_date')
            ->get();

        return Inertia::render('accounting/recurring-entries/index', [
            'entries' => $entries,
            'upcomingEntries' => $upcomingEntries,
            'filters' => $request->only(['status']),
        ]);
    }

    public function create()
    {
        $accounts = Account::where('is_active', true)
            ->orderBy('code')
            ->get(['id', 'code', 'name', 'type']);

        return Inertia::render('accounting/recurring-entries/create', [
            'accounts' => $accounts,
            'frequencies' => [
                'daily' => 'Daily',
                'weekly' => 'Weekly',
                'monthly' => 'Monthly',
                'quarterly' => 'Quarterly',
                'yearly' => 'Yearly',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'frequency' => 'required|in:daily,weekly,monthly,quarterly,yearly',
            'day_of_week' => 'nullable|integer|min:0|max:6',
            'day_of_month' => 'nullable|integer|min:1|max:31',
            'month_of_year' => 'nullable|integer|min:1|max:12',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'max_occurrences' => 'nullable|integer|min:1',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|exists:accounts,id',
            'lines.*.description' => 'nullable|string',
            'lines.*.debit' => 'required|numeric|min:0',
            'lines.*.credit' => 'required|numeric|min:0',
        ]);

        // Validate balanced entry
        $totalDebit = collect($validated['lines'])->sum('debit');
        $totalCredit = collect($validated['lines'])->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.01) {
            return back()->withErrors(['lines' => 'Debits must equal credits.']);
        }

        DB::transaction(function () use ($validated, $totalDebit) {
            $entry = RecurringJournalEntry::create([
                'name' => $validated['name'],
                'description' => $validated['description'],
                'frequency' => $validated['frequency'],
                'day_of_week' => $validated['day_of_week'],
                'day_of_month' => $validated['day_of_month'],
                'month_of_year' => $validated['month_of_year'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'next_run_date' => $validated['start_date'],
                'max_occurrences' => $validated['max_occurrences'],
                'total_amount' => $totalDebit,
                'created_by' => auth()->id(),
            ]);

            foreach ($validated['lines'] as $index => $line) {
                $entry->lines()->create([
                    'account_id' => $line['account_id'],
                    'description' => $line['description'],
                    'debit' => $line['debit'],
                    'credit' => $line['credit'],
                    'line_order' => $index,
                ]);
            }
        });

        return redirect()->route('accounting.recurring-entries.index')
            ->with('success', 'Recurring entry created successfully.');
    }

    public function show(RecurringJournalEntry $recurringEntry)
    {
        $recurringEntry->load(['lines.account', 'createdBy', 'generatedEntries' => function ($q) {
            $q->orderBy('entry_date', 'desc')->limit(10);
        }]);

        return Inertia::render('accounting/recurring-entries/show', [
            'entry' => $recurringEntry,
        ]);
    }

    public function toggle(RecurringJournalEntry $recurringEntry)
    {
        $recurringEntry->update([
            'is_active' => !$recurringEntry->is_active,
        ]);

        $status = $recurringEntry->is_active ? 'activated' : 'paused';
        return redirect()->back()->with('success', "Recurring entry {$status}.");
    }

    public function runNow(RecurringJournalEntry $recurringEntry)
    {
        if (!$recurringEntry->is_active) {
            return redirect()->back()->with('error', 'Cannot run inactive recurring entry.');
        }

        $journalEntry = $recurringEntry->generateJournalEntry();

        if ($journalEntry) {
            return redirect()->back()->with('success', 'Journal entry generated successfully.');
        }

        return redirect()->back()->with('error', 'Entry is not due yet or has reached maximum occurrences.');
    }

    public function destroy(RecurringJournalEntry $recurringEntry)
    {
        $recurringEntry->delete();

        return redirect()->route('accounting.recurring-entries.index')
            ->with('success', 'Recurring entry deleted.');
    }
}
