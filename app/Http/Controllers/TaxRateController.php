<?php

namespace App\Http\Controllers;

use App\Models\TaxRate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaxRateController extends Controller
{
    public function index()
    {
        $taxRates = TaxRate::orderBy('is_default', 'desc')->orderBy('name')->get();

        return Inertia::render('tax-rates/index', [
            'taxRates' => $taxRates,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:tax_rates,code',
            'rate' => 'required|numeric|min:0|max:100',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        // If setting as default, unset other defaults
        if ($validated['is_default'] ?? false) {
            TaxRate::where('is_default', true)->update(['is_default' => false]);
        }

        TaxRate::create($validated);

        return redirect()->back()->with('success', 'messages.tax_rate_created');
    }

    public function update(Request $request, TaxRate $taxRate)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:tax_rates,code,' . $taxRate->id,
            'rate' => 'required|numeric|min:0|max:100',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        // If setting as default, unset other defaults
        if ($validated['is_default'] ?? false) {
            TaxRate::where('is_default', true)->where('id', '!=', $taxRate->id)->update(['is_default' => false]);
        }

        $taxRate->update($validated);

        return redirect()->back()->with('success', 'messages.tax_rate_updated');
    }

    public function destroy(TaxRate $taxRate)
    {
        if ($taxRate->is_default) {
            return redirect()->back()->with('error', 'messages.tax_rate_cannot_delete_default');
        }

        $taxRate->delete();

        return redirect()->back()->with('success', 'messages.tax_rate_deleted');
    }
}
