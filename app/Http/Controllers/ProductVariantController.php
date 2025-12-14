<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\VariantOption;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProductVariantController extends Controller
{
    public function index(Product $product)
    {
        $product->load(['variants.options', 'variantOptions']);
        
        // Group options by name
        $optionGroups = $product->variantOptions()
            ->orderBy('name')
            ->orderBy('display_order')
            ->get()
            ->groupBy('name');

        return Inertia::render('products/variants', [
            'product' => $product,
            'variants' => $product->variants,
            'optionGroups' => $optionGroups,
        ]);
    }

    public function storeOption(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'value' => 'required|string|max:255',
            'display_order' => 'nullable|integer',
        ]);

        VariantOption::create([
            'product_id' => $product->id,
            'name' => $validated['name'],
            'value' => $validated['value'],
            'display_order' => $validated['display_order'] ?? 0,
        ]);

        return redirect()->back()->with('success', 'Variant option added successfully.');
    }

    public function storeVariant(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'sku' => 'nullable|string|max:255|unique:product_variants,sku',
            'price' => 'nullable|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'barcode' => 'nullable|string|max:255',
            'image' => 'nullable|string',
            'option_ids' => 'required|array|min:1',
            'option_ids.*' => 'exists:variant_options,id',
        ]);

        $variant = ProductVariant::create([
            'product_id' => $product->id,
            'name' => $validated['name'],
            'sku' => $validated['sku'] ?? null,
            'price' => $validated['price'] ?? null,
            'cost' => $validated['cost'] ?? null,
            'stock_quantity' => $validated['stock_quantity'],
            'barcode' => $validated['barcode'] ?? null,
            'image' => $validated['image'] ?? null,
        ]);

        $variant->options()->sync($validated['option_ids']);

        return redirect()->back()->with('success', 'Product variant created successfully.');
    }

    public function update(Request $request, ProductVariant $variant)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'sku' => 'nullable|string|max:255|unique:product_variants,sku,' . $variant->id,
            'price' => 'nullable|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'barcode' => 'nullable|string|max:255',
            'image' => 'nullable|string',
            'is_active' => 'boolean',
            'option_ids' => 'nullable|array',
            'option_ids.*' => 'exists:variant_options,id',
        ]);

        $variant->update($validated);

        if (isset($validated['option_ids'])) {
            $variant->options()->sync($validated['option_ids']);
        }

        return redirect()->back()->with('success', 'Variant updated successfully.');
    }

    public function destroy(ProductVariant $variant)
    {
        $variant->delete();

        return redirect()->back()->with('success', 'Variant deleted successfully.');
    }

    public function destroyOption(VariantOption $option)
    {
        // Check if option is used in any variants
        if ($option->variants()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete option that is used in variants.');
        }

        $option->delete();

        return redirect()->back()->with('success', 'Option deleted successfully.');
    }
}
