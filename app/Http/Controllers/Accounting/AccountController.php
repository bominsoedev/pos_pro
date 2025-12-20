<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $query = Account::query()->with('parent');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('code', 'like', "%{$request->search}%")
                    ->orWhere('name', 'like', "%{$request->search}%")
                    ->orWhere('name_mm', 'like', "%{$request->search}%");
            });
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        $accounts = $query->orderBy('code')->paginate(50);

        // Get hierarchical accounts for tree view
        $accountTree = Account::with('children')
            ->whereNull('parent_id')
            ->orderBy('code')
            ->get();

        return Inertia::render('accounting/chart-of-accounts/index', [
            'accounts' => $accounts,
            'accountTree' => $accountTree,
            'accountTypes' => [
                'asset' => 'Assets',
                'liability' => 'Liabilities',
                'equity' => 'Equity',
                'income' => 'Income',
                'expense' => 'Expenses',
            ],
            'subtypes' => Account::SUBTYPES,
            'filters' => $request->only(['search', 'type']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:accounts,code',
            'name' => 'required|string|max:255',
            'name_mm' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:asset,liability,equity,income,expense',
            'subtype' => 'required|string',
            'parent_id' => 'nullable|exists:accounts,id',
            'opening_balance' => 'nullable|numeric',
            'opening_balance_date' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        // Calculate level based on parent
        $level = 0;
        if ($validated['parent_id']) {
            $parent = Account::find($validated['parent_id']);
            $level = $parent->level + 1;
        }
        $validated['level'] = $level;

        Account::create($validated);

        return redirect()->back()->with('success', 'Account created successfully.');
    }

    public function update(Request $request, Account $account)
    {
        if ($account->is_system) {
            return redirect()->back()->with('error', 'System accounts cannot be modified.');
        }

        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:accounts,code,' . $account->id,
            'name' => 'required|string|max:255',
            'name_mm' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:asset,liability,equity,income,expense',
            'subtype' => 'required|string',
            'parent_id' => 'nullable|exists:accounts,id',
            'opening_balance' => 'nullable|numeric',
            'opening_balance_date' => 'nullable|date',
            'is_active' => 'boolean',
        ]);

        // Prevent circular reference
        if ($validated['parent_id'] == $account->id) {
            return redirect()->back()->with('error', 'Account cannot be its own parent.');
        }

        // Calculate level
        $level = 0;
        if ($validated['parent_id']) {
            $parent = Account::find($validated['parent_id']);
            $level = $parent->level + 1;
        }
        $validated['level'] = $level;

        $account->update($validated);

        return redirect()->back()->with('success', 'Account updated successfully.');
    }

    public function destroy(Account $account)
    {
        if ($account->is_system) {
            return redirect()->back()->with('error', 'System accounts cannot be deleted.');
        }

        if ($account->journalEntryLines()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete account with journal entries.');
        }

        if ($account->children()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete account with child accounts.');
        }

        $account->delete();

        return redirect()->back()->with('success', 'Account deleted successfully.');
    }

    public function show(Account $account)
    {
        $account->load(['parent', 'children', 'journalEntryLines.journalEntry']);
        
        $ledgerEntries = $account->journalEntryLines()
            ->with(['journalEntry'])
            ->whereHas('journalEntry', function ($q) {
                $q->where('status', 'posted');
            })
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return Inertia::render('accounting/chart-of-accounts/show', [
            'account' => $account,
            'ledgerEntries' => $ledgerEntries,
            'balance' => $account->balance,
        ]);
    }
}
