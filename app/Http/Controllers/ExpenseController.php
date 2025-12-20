<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Services\AccountingService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with('user');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('expense_number', 'like', "%{$request->search}%")
                    ->orWhere('title', 'like', "%{$request->search}%")
                    ->orWhere('category', 'like', "%{$request->search}%");
            });
        }

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->date_from) {
            $query->whereDate('expense_date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('expense_date', '<=', $request->date_to);
        }

        $expenses = $query->orderBy('expense_date', 'desc')->paginate(20);
        $categories = Expense::distinct()->pluck('category')->sort()->values();

        return Inertia::render('expenses/index', [
            'expenses' => $expenses,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'date_from', 'date_to']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'payment_method' => 'required|in:cash,card,bank_transfer,other',
            'reference_number' => 'nullable|string|max:255',
            'receipt' => 'nullable|string',
            'is_recurring' => 'boolean',
            'recurring_frequency' => 'nullable|in:daily,weekly,monthly,yearly',
            'notes' => 'nullable|string',
        ]);

        $expense = Expense::create([
            'expense_number' => Expense::generateExpenseNumber(),
            'user_id' => auth()->id(),
            ...$validated,
        ]);

        // Create accounting journal entry for the expense
        try {
            $accountingService = new AccountingService();
            $accountingService->createExpenseEntry($expense);
        } catch (\Exception $e) {
            \Log::error('Failed to create accounting entry for expense: ' . $e->getMessage());
        }

        return redirect()->back()->with('success', 'Expense created successfully.');
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'amount' => 'required|numeric|min:0',
            'expense_date' => 'required|date',
            'payment_method' => 'required|in:cash,card,bank_transfer,other',
            'reference_number' => 'nullable|string|max:255',
            'receipt' => 'nullable|string',
            'is_recurring' => 'boolean',
            'recurring_frequency' => 'nullable|in:daily,weekly,monthly,yearly',
            'notes' => 'nullable|string',
        ]);

        $expense->update($validated);

        return redirect()->back()->with('success', 'Expense updated successfully.');
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();

        return redirect()->back()->with('success', 'Expense deleted successfully.');
    }
}
