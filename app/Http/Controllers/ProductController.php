<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with(['category', 'images']);

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
            'images' => 'nullable|array',
            'images.*' => 'nullable|string',
            'is_active' => 'boolean',
            'track_inventory' => 'boolean',
        ]);

        $product = Product::create($validated);

        // Handle multiple images
        if ($request->has('images') && is_array($request->images)) {
            foreach ($request->images as $index => $imageUrl) {
                if ($imageUrl) {
                    ProductImage::create([
                        'product_id' => $product->id,
                        'image_url' => $imageUrl,
                        'sort_order' => $index,
                        'is_primary' => $index === 0,
                    ]);
                }
            }
        }

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
            'images' => 'nullable|array',
            'images.*' => 'nullable|string',
            'is_active' => 'boolean',
            'track_inventory' => 'boolean',
        ]);

        $product->update($validated);

        // Handle multiple images - update existing images
        if ($request->has('images') && is_array($request->images)) {
            $newImageUrls = array_filter($request->images);
            $existingImages = $product->images()->get();
            $existingUrls = $existingImages->pluck('image_url')->toArray();
            
            // Delete images that are no longer in the new list
            $imagesToDelete = $existingImages->filter(function ($img) use ($newImageUrls) {
                return !in_array($img->image_url, $newImageUrls);
            });
            foreach ($imagesToDelete as $img) {
                $img->delete();
            }
            
            // Update or create images
            foreach ($newImageUrls as $index => $imageUrl) {
                if ($imageUrl) {
                    $existingImage = $existingImages->firstWhere('image_url', $imageUrl);
                    
                    if ($existingImage) {
                        // Update existing image
                        $existingImage->update([
                            'sort_order' => $index,
                            'is_primary' => $index === 0,
                        ]);
                    } else {
                        // Create new image
                        ProductImage::create([
                            'product_id' => $product->id,
                            'image_url' => $imageUrl,
                            'sort_order' => $index,
                            'is_primary' => $index === 0,
                        ]);
                    }
                }
            }
            
            // Ensure only one primary image
            $product->images()->where('is_primary', true)->update(['is_primary' => false]);
            $firstImage = $product->images()->orderBy('sort_order')->first();
            if ($firstImage) {
                $firstImage->update(['is_primary' => true]);
            }
        }

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

    public function storeImage(Request $request, Product $product)
    {
        $request->validate([
            'image' => 'required|string',
            'is_primary' => 'nullable|boolean',
            'sort_order' => 'nullable|integer',
        ]);

        if ($request->is_primary) {
            $product->images()->update(['is_primary' => false]);
        }

        $image = $product->images()->create([
            'image_url' => $request->image,
            'is_primary' => $request->is_primary ?? false,
            'sort_order' => $request->sort_order ?? $product->images()->count(),
        ]);

        return response()->json($image);
    }

    public function deleteImage(Product $product, ProductImage $image)
    {
        if ($image->product_id !== $product->id) {
            return response()->json(['error' => 'Image does not belong to this product'], 403);
        }

        // Delete file from storage if needed
        if (Storage::disk('public')->exists(str_replace('/storage/', '', $image->image_url))) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $image->image_url));
        }

        $image->delete();

        return response()->json(['success' => true]);
    }

    public function setPrimaryImage(Product $product, ProductImage $image)
    {
        if ($image->product_id !== $product->id) {
            return response()->json(['error' => 'Image does not belong to this product'], 403);
        }

        $product->images()->update(['is_primary' => false]);
        $image->update(['is_primary' => true]);

        return response()->json(['success' => true]);
    }
}

