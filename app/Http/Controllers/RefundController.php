<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Refund;
use App\Models\RefundItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RefundController extends Controller
{
    public function store(Request $request, Order $order)
    {
        $validated = $request->validate([
            'type' => 'required|in:full,partial',
            'amount' => 'required|numeric|min:0|max:' . $order->total,
            'reason' => 'nullable|string|max:500',
            'notes' => 'nullable|string',
            'items' => 'required_if:type,partial|array',
            'items.*.order_item_id' => 'required|exists:order_items,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.amount' => 'required|numeric|min:0',
            'items.*.reason' => 'nullable|string',
        ]);

        // Check if order can be refunded
        if ($order->status !== 'completed') {
            return redirect()->back()->with('error', 'Only completed orders can be refunded.');
        }

        $totalRefunded = $order->refunds()->where('status', 'completed')->sum('amount');
        $remainingAmount = $order->total - $totalRefunded;

        if ($validated['amount'] > $remainingAmount) {
            return redirect()->back()->with('error', 'Refund amount exceeds remaining order amount.');
        }

        DB::beginTransaction();

        try {
            $refund = Refund::create([
                'order_id' => $order->id,
                'user_id' => auth()->id(),
                'type' => $validated['type'],
                'status' => 'completed',
                'amount' => $validated['amount'],
                'reason' => $validated['reason'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Handle partial refund items
            if ($validated['type'] === 'partial' && isset($validated['items'])) {
                foreach ($validated['items'] as $item) {
                    $orderItem = $order->items()->findOrFail($item['order_item_id']);
                    
                    RefundItem::create([
                        'refund_id' => $refund->id,
                        'order_item_id' => $orderItem->id,
                        'product_id' => $orderItem->product_id,
                        'quantity' => $item['quantity'],
                        'amount' => $item['amount'],
                        'reason' => $item['reason'] ?? null,
                    ]);

                    // Restore stock if product tracks inventory
                    $product = Product::find($orderItem->product_id);
                    if ($product && $product->track_inventory) {
                        $product->increment('stock_quantity', $item['quantity']);
                    }
                }
            } else {
                // Full refund - restore all items
                foreach ($order->items as $orderItem) {
                    RefundItem::create([
                        'refund_id' => $refund->id,
                        'order_item_id' => $orderItem->id,
                        'product_id' => $orderItem->product_id,
                        'quantity' => $orderItem->quantity,
                        'amount' => $orderItem->total,
                        'reason' => $validated['reason'] ?? null,
                    ]);

                    // Restore stock
                    $product = Product::find($orderItem->product_id);
                    if ($product && $product->track_inventory) {
                        $product->increment('stock_quantity', $orderItem->quantity);
                    }
                }
            }

            // Update order status if fully refunded
            $newTotalRefunded = $order->refunds()->where('status', 'completed')->sum('amount');
            if ($newTotalRefunded >= $order->total) {
                $order->update([
                    'status' => 'refunded',
                    'payment_status' => 'refunded',
                ]);
            } else {
                $order->update(['payment_status' => 'partial']);
            }

            DB::commit();

            return redirect()->back()->with('success', 'Refund processed successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Error processing refund: ' . $e->getMessage());
        }
    }

    public function index(Request $request)
    {
        $query = Refund::with(['order', 'user']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('refund_number', 'like', "%{$request->search}%")
                    ->orWhereHas('order', function ($sq) use ($request) {
                        $sq->where('order_number', 'like', "%{$request->search}%");
                    });
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $refunds = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('refunds/index', [
            'refunds' => $refunds,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to']),
        ]);
    }

    public function show(Refund $refund)
    {
        $refund->load(['order.customer', 'order.user', 'items.orderItem', 'items.product', 'user']);

        return Inertia::render('refunds/show', [
            'refund' => $refund,
        ]);
    }
}
