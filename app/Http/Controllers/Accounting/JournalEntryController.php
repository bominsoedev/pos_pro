<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\FiscalYear;
use App\Models\JournalEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class JournalEntryController extends Controller
{
    public function index(Request $request)
    {
        $query = JournalEntry::with(['createdBy', 'lines.account']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('entry_number', 'like', "%{$request->search}%")
                    ->orWhere('description', 'like', "%{$request->search}%")
                    ->orWhere('reference', 'like', "%{$request->search}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->date_from) {
            $query->where('entry_date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->where('entry_date', '<=', $request->date_to);
        }

        $entries = $query->orderBy('entry_date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(20);

        return Inertia::render('accounting/journal-entries/index', [
            'entries' => $entries,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to']),
        ]);
    }

    public function create()
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

        return Inertia::render('accounting/journal-entries/create', [
            'accounts' => $accounts,
            'entryNumber' => JournalEntry::generateEntryNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'entry_date' => 'required|date',
            'reference' => 'nullable|string|max:255',
            'description' => 'required|string',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|exists:accounts,id',
            'lines.*.description' => 'nullable|string',
            'lines.*.debit' => 'required|numeric|min:0',
            'lines.*.credit' => 'required|numeric|min:0',
        ]);

        // Validate that debits equal credits
        $totalDebit = collect($validated['lines'])->sum('debit');
        $totalCredit = collect($validated['lines'])->sum('credit');

        if (bccomp($totalDebit, $totalCredit, 2) !== 0) {
            return redirect()->back()
                ->withErrors(['lines' => 'Total debits must equal total credits.'])
                ->withInput();
        }

        // Validate each line has either debit or credit
        foreach ($validated['lines'] as $index => $line) {
            if ($line['debit'] == 0 && $line['credit'] == 0) {
                return redirect()->back()
                    ->withErrors(["lines.{$index}" => 'Each line must have a debit or credit amount.'])
                    ->withInput();
            }
            if ($line['debit'] > 0 && $line['credit'] > 0) {
                return redirect()->back()
                    ->withErrors(["lines.{$index}" => 'A line cannot have both debit and credit.'])
                    ->withInput();
            }
        }

        DB::transaction(function () use ($validated, $totalDebit, $totalCredit) {
            $fiscalYear = FiscalYear::findByDate($validated['entry_date']);

            $entry = JournalEntry::create([
                'entry_number' => JournalEntry::generateEntryNumber(),
                'entry_date' => $validated['entry_date'],
                'fiscal_year_id' => $fiscalYear?->id,
                'reference' => $validated['reference'],
                'description' => $validated['description'],
                'source' => 'manual',
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'created_by' => auth()->id(),
            ]);

            foreach ($validated['lines'] as $index => $line) {
                $entry->lines()->create([
                    'account_id' => $line['account_id'],
                    'description' => $line['description'] ?? null,
                    'debit' => $line['debit'],
                    'credit' => $line['credit'],
                    'line_order' => $index,
                ]);
            }
        });

        return redirect()->route('accounting.journal-entries.index')
            ->with('success', 'Journal entry created successfully.');
    }

    public function show(JournalEntry $journalEntry)
    {
        $journalEntry->load(['createdBy', 'postedBy', 'voidedBy', 'fiscalYear', 'lines.account']);

        return Inertia::render('accounting/journal-entries/show', [
            'entry' => $journalEntry,
        ]);
    }

    public function post(JournalEntry $journalEntry)
    {
        if ($journalEntry->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft entries can be posted.');
        }

        if (!$journalEntry->isBalanced()) {
            return redirect()->back()->with('error', 'Entry is not balanced.');
        }

        $journalEntry->post();

        return redirect()->back()->with('success', 'Journal entry posted successfully.');
    }

    public function void(Request $request, JournalEntry $journalEntry)
    {
        $request->validate([
            'reason' => 'required|string',
        ]);

        if ($journalEntry->status !== 'posted') {
            return redirect()->back()->with('error', 'Only posted entries can be voided.');
        }

        $journalEntry->void($request->reason);

        return redirect()->back()->with('success', 'Journal entry voided successfully.');
    }

    public function reverse(JournalEntry $journalEntry)
    {
        if ($journalEntry->status !== 'posted') {
            return redirect()->back()->with('error', 'Only posted entries can be reversed.');
        }

        $reversal = $journalEntry->createReversingEntry();
        $reversal->post();

        return redirect()->route('accounting.journal-entries.show', $reversal)
            ->with('success', 'Reversing entry created and posted.');
    }
}
