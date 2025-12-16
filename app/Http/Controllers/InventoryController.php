<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\InventoryLog;
use App\Models\User;
use App\Models\Setting;
use App\Notifications\LowStockAlert;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('category')->where('track_inventory', true);

        if ($request->low_stock) {
            $query->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('sku', 'like', "%{$request->search}%")
                    ->orWhere('barcode', 'like', "%{$request->search}%");
            });
        }

        $products = $query->orderBy('stock_quantity', 'asc')->paginate(20);

        $lowStockCount = Product::where('track_inventory', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->count();

        return Inertia::render('inventory/index', [
            'products' => $products,
            'lowStockCount' => $lowStockCount,
            'filters' => $request->only(['search', 'low_stock']),
        ]);
    }

    public function adjust(Request $request, Product $product)
    {
        $validated = $request->validate([
            'quantity_change' => 'required|integer',
            'type' => 'required|in:purchase,adjustment,return',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $quantityBefore = $product->stock_quantity;
            $quantityChange = $validated['quantity_change'];
            
            // For adjustment, quantity_change can be positive or negative
            // For purchase and return, it should be positive
            if ($validated['type'] === 'adjustment') {
                $product->increment('stock_quantity', $quantityChange);
            } else {
                if ($quantityChange < 0) {
                    throw new \Exception('Quantity change must be positive for purchase and return');
                }
                $product->increment('stock_quantity', $quantityChange);
            }

            $quantityAfter = $product->stock_quantity;

            InventoryLog::create([
                'product_id' => $product->id,
                'user_id' => auth()->id(),
                'type' => $validated['type'],
                'quantity_change' => $quantityChange,
                'quantity_before' => $quantityBefore,
                'quantity_after' => $quantityAfter,
                'notes' => $validated['notes'],
            ]);

            // Check for low stock and send notification
            $product->refresh();
            if ($product->isLowStock() && Setting::get('low_stock_notification', true)) {
                $admins = User::whereHas('roles', function ($query) {
                    $query->where('slug', 'admin');
                })->get();

                if ($admins->isNotEmpty()) {
                    try {
                        Notification::send($admins, new LowStockAlert($product));
                    } catch (\Exception $e) {
                        \Log::error('Failed to send low stock alert: ' . $e->getMessage());
                    }
                }
            }

            DB::commit();

            return redirect()->back()->with('success', 'Stock adjusted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function history(Product $product)
    {
        $logs = InventoryLog::where('product_id', $product->id)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('inventory/history', [
            'product' => $product->load('category'),
            'logs' => $logs,
        ]);
    }
}

