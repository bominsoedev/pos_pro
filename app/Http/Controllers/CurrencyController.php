<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class CurrencyController extends Controller
{
    public function index(Request $request)
    {
        $query = Currency::query();

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('code', 'like', "%{$request->search}%")
                    ->orWhere('name', 'like', "%{$request->search}%");
            });
        }

        if ($request->active_only) {
            $query->where('is_active', true);
        }

        $currencies = $query->orderBy('is_default', 'desc')->orderBy('sort_order')->orderBy('name')->get();

        return Inertia::render('currencies/index', [
            'currencies' => $currencies,
            'filters' => $request->only(['search', 'active_only']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:3|unique:currencies,code',
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10',
            'decimal_places' => 'required|integer|min:0|max:4',
            'exchange_rate' => 'required|numeric|min:0',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        Currency::create($validated);

        return redirect()->back()->with('success', __('messages.currency_created'));
    }

    public function update(Request $request, Currency $currency)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:3|unique:currencies,code,' . $currency->id,
            'name' => 'required|string|max:255',
            'symbol' => 'required|string|max:10',
            'decimal_places' => 'required|integer|min:0|max:4',
            'exchange_rate' => 'required|numeric|min:0',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $currency->update($validated);

        return redirect()->back()->with('success', __('messages.currency_updated'));
    }

    public function destroy(Currency $currency)
    {
        if ($currency->is_default) {
            return redirect()->back()->with('error', __('messages.currency_cannot_delete_default'));
        }

        $currency->delete();

        return redirect()->back()->with('success', __('messages.currency_deleted'));
    }

    public function setDefault(Currency $currency)
    {
        if (!$currency->is_active) {
            return redirect()->back()->with('error', __('messages.currency_cannot_set_default_inactive'));
        }

        Currency::where('is_default', true)->update(['is_default' => false]);
        $currency->update(['is_default' => true]);

        return redirect()->back()->with('success', __('messages.currency_set_default'));
    }
}
