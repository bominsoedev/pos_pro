<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\ProductBundle;
use App\Models\BundleItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BundleController extends Controller
{
    public function index()
    {
        $bundles = ProductBundle::with(['product', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('bundles/index', [
            'bundles' => $bundles,
        ]);
    }

    public function create()
    {
        $products = Product::where('is_active', true)
            ->whereDoesntHave('bundle')
            ->orderBy('name')
            ->get();

        return Inertia::render('bundles/create', [
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'bundle_price' => 'required|numeric|min:0',
            'product_id' => 'required|exists:products,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        // Check if product already has a bundle
        if (ProductBundle::where('product_id', $validated['product_id'])->exists()) {
            return redirect()->back()->with('error', 'This product already has a bundle.');
        }

        $bundle = ProductBundle::create([
            'product_id' => $validated['product_id'],
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'bundle_price' => $validated['bundle_price'],
        ]);

        foreach ($validated['items'] as $index => $item) {
            BundleItem::create([
                'bundle_id' => $bundle->id,
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'display_order' => $index,
            ]);
        }

        $bundle->updateSavings();

        return redirect()->route('bundles.index')->with('success', 'Bundle created successfully.');
    }

    public function show(ProductBundle $bundle)
    {
        $bundle->load(['product', 'items.product']);

        return Inertia::render('bundles/show', [
            'bundle' => $bundle,
        ]);
    }

    public function edit(ProductBundle $bundle)
    {
        $bundle->load(['product', 'items.product']);
        $products = Product::where('is_active', true)
            ->where(function ($query) use ($bundle) {
                $query->whereDoesntHave('bundle')
                    ->orWhere('id', $bundle->product_id);
            })
            ->orderBy('name')
            ->get();

        return Inertia::render('bundles/edit', [
            'bundle' => $bundle,
            'products' => $products,
        ]);
    }

    public function update(Request $request, ProductBundle $bundle)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'bundle_price' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        $bundle->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'bundle_price' => $validated['bundle_price'],
        ]);

        // Delete old items
        $bundle->items()->delete();

        // Create new items
        foreach ($validated['items'] as $index => $item) {
            BundleItem::create([
                'bundle_id' => $bundle->id,
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'display_order' => $index,
            ]);
        }

        $bundle->updateSavings();

        return redirect()->route('bundles.index')->with('success', 'Bundle updated successfully.');
    }

    public function destroy(ProductBundle $bundle)
    {
        $bundle->delete();

        return redirect()->route('bundles.index')->with('success', 'Bundle deleted successfully.');
    }
}
