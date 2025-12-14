<?php

namespace App\Http\Controllers;

use App\Models\Discount;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DiscountController extends Controller
{
    public function index(Request $request)
    {
        $query = Discount::query();

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('code', 'like', "%{$request->search}%")
                    ->orWhere('name', 'like', "%{$request->search}%");
            });
        }

        if ($request->active_only) {
            $query->where('is_active', true);
        }

        $discounts = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('discounts/index', [
            'discounts' => $discounts,
            'filters' => $request->only(['search', 'active_only']),
        ]);
    }

    public function validate(Request $request)
    {
        $code = $request->get('code');

        if (!$code) {
            return response()->json(['error' => 'Discount code is required'], 400);
        }

        $discount = Discount::where('code', strtoupper($code))->first();

        if (!$discount) {
            return response()->json(['error' => 'Discount code not found'], 404);
        }

        if (!$discount->isValid()) {
            return response()->json(['error' => 'Discount code is not valid or has expired'], 400);
        }

        return response()->json($discount);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:discounts,code',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'minimum_amount' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'boolean',
        ]);

        Discount::create($validated);

        return redirect()->back()->with('success', 'Discount created successfully.');
    }

    public function update(Request $request, Discount $discount)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:255|unique:discounts,code,' . $discount->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'minimum_amount' => 'nullable|numeric|min:0',
            'max_uses' => 'nullable|integer|min:1',
            'valid_from' => 'nullable|date',
            'valid_until' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'boolean',
        ]);

        $discount->update($validated);

        return redirect()->back()->with('success', 'Discount updated successfully.');
    }

    public function destroy(Discount $discount)
    {
        $discount->delete();

        return redirect()->back()->with('success', 'Discount deleted successfully.');
    }
}
