<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category')->where('is_active', true);

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('sku', 'like', "%{$request->search}%")
                    ->orWhere('barcode', 'like', "%{$request->search}%");
            });
        }

        $products = $query->orderBy('name')->paginate(24);

        $categories = Category::where('is_active', true)->get();
        $customers = Customer::orderBy('name')->limit(50)->get();
        $taxRate = Setting::get('tax_rate', 0);

        return Inertia::render('pos/index', [
            'products' => $products,
            'categories' => $categories,
            'customers' => $customers,
            'taxRate' => $taxRate,
            'filters' => $request->only(['search', 'category_id']),
        ]);
    }

    public function searchProduct(Request $request)
    {
        $query = $request->get('q');

        $products = Product::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('sku', 'like', "%{$query}%")
                    ->orWhere('barcode', 'like', "%{$query}%");
            })
            ->with('category')
            ->limit(10)
            ->get();

        return response()->json($products);
    }

    public function findByBarcode(Request $request)
    {
        $barcode = trim($request->get('barcode'));

        if (empty($barcode)) {
            return response()->json(['error' => 'Barcode is required'], 400);
        }

        // Search by barcode first, then by SKU if not found
        $product = Product::where('is_active', true)
            ->where(function ($query) use ($barcode) {
                $query->where('barcode', $barcode)
                    ->orWhere('sku', $barcode);
            })
            ->with('category')
            ->first();

        if (!$product) {
            return response()->json([
                'error' => 'Product not found',
                'message' => "No product found with barcode/SKU: {$barcode}"
            ], 404);
        }

        return response()->json($product);
    }
}

