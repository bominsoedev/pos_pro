<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\PointTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LoyaltyController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::where('loyalty_points', '>', 0);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%")
                    ->orWhere('phone', 'like', "%{$request->search}%");
            });
        }

        if ($request->tier && $request->tier !== 'all') {
            $query->where('loyalty_tier', $request->tier);
        }

        $customers = $query->orderBy('loyalty_points', 'desc')->paginate(20);

        return Inertia::render('loyalty/index', [
            'customers' => $customers,
            'filters' => $request->only(['search', 'tier']),
        ]);
    }

    public function show(Customer $customer)
    {
        $customer->load('pointTransactions.order');
        $transactions = $customer->pointTransactions()->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('loyalty/show', [
            'customer' => $customer,
            'transactions' => $transactions,
        ]);
    }

    public function adjustPoints(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'points' => 'required|integer',
            'type' => 'required|in:add,subtract',
            'description' => 'nullable|string',
        ]);

        if ($validated['type'] === 'add') {
            $customer->addPoints(
                $validated['points'],
                'adjusted',
                null,
                $validated['description'] ?? 'Manual adjustment'
            );
        } else {
            try {
                $customer->redeemPoints(
                    $validated['points'],
                    $validated['description'] ?? 'Manual adjustment'
                );
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage());
            }
        }

        return redirect()->back()->with('success', 'Points adjusted successfully.');
    }
}
