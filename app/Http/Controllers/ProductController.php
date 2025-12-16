<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Validator;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('sku', 'like', "%{$request->search}%")
                    ->orWhere('barcode', 'like', "%{$request->search}%");
            });
        }

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->low_stock) {
            $query->where('track_inventory', true)
                ->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
        }

        $products = $query->orderBy('created_at', 'desc')->paginate(20);

        $categories = Category::where('is_active', true)->get();

        return Inertia::render('products/index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id', 'low_stock', 'price_min', 'price_max', 'in_stock_only']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255|unique:products,sku',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'low_stock_threshold' => 'required|integer|min:0',
            'barcode' => 'nullable|string|max:255',
            'image' => 'nullable|string',
            'is_active' => 'boolean',
            'track_inventory' => 'boolean',
        ]);

        Product::create($validated);

        return redirect()->back()->with('success', 'Product created successfully.');
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255|unique:products,sku,' . $product->id,
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'price' => 'required|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'low_stock_threshold' => 'required|integer|min:0',
            'barcode' => 'nullable|string|max:255',
            'image' => 'nullable|string',
            'is_active' => 'boolean',
            'track_inventory' => 'boolean',
        ]);

        $product->update($validated);

        return redirect()->back()->with('success', 'Product updated successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:products,id',
        ]);

        Product::whereIn('id', $validated['ids'])->delete();

        return redirect()->back()->with('success', count($validated['ids']) . ' product(s) deleted successfully.');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->back()->with('success', 'Product deleted successfully.');
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|mimes:xlsx,xls,csv|max:5120',
        ]);

        try {
            $file = $request->file('file');
            $data = Excel::toArray([], $file);
            
            if (empty($data) || empty($data[0])) {
                return redirect()->back()->with('error', 'File is empty or invalid.');
            }

            $rows = $data[0];
            $header = array_shift($rows); // Remove header row
            
            $imported = 0;
            $errors = [];

            foreach ($rows as $index => $row) {
                try {
                    $rowData = array_combine($header, $row);
                    
                    $validator = Validator::make($rowData, [
                        'name' => 'required|string|max:255',
                        'sku' => 'nullable|string|max:255|unique:products,sku',
                        'price' => 'required|numeric|min:0',
                        'cost' => 'nullable|numeric|min:0',
                        'stock_quantity' => 'required|integer|min:0',
                        'low_stock_threshold' => 'required|integer|min:0',
                    ]);

                    if ($validator->fails()) {
                        $errors[] = "Row " . ($index + 2) . ": " . implode(', ', $validator->errors()->all());
                        continue;
                    }

                    // Find or create category
                    $category = null;
                    if (!empty($rowData['category'])) {
                        $category = Category::firstOrCreate(
                            ['name' => $rowData['category']],
                            ['is_active' => true]
                        );
                    }

                    Product::create([
                        'name' => $rowData['name'],
                        'sku' => $rowData['sku'] ?? null,
                        'description' => $rowData['description'] ?? null,
                        'category_id' => $category?->id,
                        'price' => $rowData['price'],
                        'cost' => $rowData['cost'] ?? 0,
                        'stock_quantity' => $rowData['stock_quantity'],
                        'low_stock_threshold' => $rowData['low_stock_threshold'],
                        'barcode' => $rowData['barcode'] ?? null,
                        'is_active' => isset($rowData['is_active']) ? (bool)$rowData['is_active'] : true,
                        'track_inventory' => isset($rowData['track_inventory']) ? (bool)$rowData['track_inventory'] : true,
                    ]);

                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Row " . ($index + 2) . ": " . $e->getMessage();
                }
            }

            $message = "Imported {$imported} product(s) successfully.";
            if (!empty($errors)) {
                $message .= " " . count($errors) . " error(s) occurred.";
            }

            return redirect()->back()
                ->with('success', $message)
                ->with('import_errors', $errors);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Import failed: ' . $e->getMessage());
        }
    }
}

