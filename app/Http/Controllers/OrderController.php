<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Customer;
use App\Models\InventoryLog;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['customer', 'user', 'items.product']);

        if ($request->search) {
            $query->where('order_number', 'like', "%{$request->search}%");
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $orders = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('orders/index', [
            'orders' => $orders,
            'filters' => $request->only(['search', 'status', 'date_from', 'date_to']),
        ]);
    }

    public function show(Order $order)
    {
        $order->load(['customer', 'user', 'items.product', 'payments', 'refunds.items']);

        return Inertia::render('orders/show', [
            'order' => $order,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'payment_method' => 'required|in:cash,card,mobile_payment,bank_transfer,other',
            'payment_amount' => 'required|numeric|min:0',
            'discount_code' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $subtotal = 0;
            $items = [];

            foreach ($validated['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);

                if ($product->track_inventory && $product->stock_quantity < $itemData['quantity']) {
                    throw new \Exception("Insufficient stock for {$product->name}");
                }

                $itemSubtotal = $itemData['price'] * $itemData['quantity'];
                $itemDiscount = $itemData['discount'] ?? 0;
                $itemTotal = $itemSubtotal - $itemDiscount;

                $subtotal += $itemTotal;

                $items[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'price' => $itemData['price'],
                    'quantity' => $itemData['quantity'],
                    'subtotal' => $itemSubtotal,
                    'discount' => $itemDiscount,
                    'total' => $itemTotal,
                ];
            }

            $taxRate = $validated['tax_rate'] ?? Setting::get('tax_rate', 0);
            $taxAmount = $subtotal * ($taxRate / 100);
            
            // Apply discount code if provided
            $discountAmount = $validated['discount_amount'] ?? 0;
            if (!empty($validated['discount_code'])) {
                $discount = Discount::where('code', strtoupper($validated['discount_code']))->first();
                if ($discount && $discount->isValid() && $subtotal >= ($discount->minimum_amount ?? 0)) {
                    $calculatedDiscount = $discount->calculateDiscount($subtotal);
                    if ($calculatedDiscount > 0) {
                        $discountAmount = $calculatedDiscount;
                        $discount->incrementUsage();
                    }
                }
            }
            
            $total = $subtotal + $taxAmount - $discountAmount;

            $order = Order::create([
                'user_id' => auth()->id(),
                'customer_id' => $validated['customer_id'] ?? null,
                'status' => 'completed',
                'payment_status' => 'paid',
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'total' => $total,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Award loyalty points (1 point per 100 MMK spent)
            if ($order->customer_id) {
                $customer = \App\Models\Customer::find($order->customer_id);
                if ($customer) {
                    $pointsEarned = floor($total / 100) * $customer->getTierMultiplier();
                    if ($pointsEarned > 0) {
                        $customer->addPoints(
                            (int)$pointsEarned,
                            'earned',
                            $order,
                            "Points earned from order #{$order->order_number}"
                        );
                    }
                }
            }

            foreach ($items as $item) {
                $orderItem = $order->items()->create($item);

                $product = Product::find($item['product_id']);
                if ($product && $product->track_inventory) {
                    $quantityBefore = $product->stock_quantity;
                    $product->decrement('stock_quantity', $item['quantity']);
                    $quantityAfter = $product->stock_quantity;

                    InventoryLog::create([
                        'product_id' => $product->id,
                        'user_id' => auth()->id(),
                        'type' => 'sale',
                        'quantity_change' => -$item['quantity'],
                        'quantity_before' => $quantityBefore,
                        'quantity_after' => $quantityAfter,
                        'notes' => "Sale - Order #{$order->order_number}",
                    ]);
                }
            }

            $order->payments()->create([
                'method' => $validated['payment_method'],
                'amount' => $validated['payment_amount'],
            ]);

            if ($validated['customer_id']) {
                $customer = Customer::find($validated['customer_id']);
                $customer->increment('total_spent', $total);
                $customer->increment('total_orders');
            }

            DB::commit();

            // For POS, return JSON with order ID for receipt printing
            if (request()->wantsJson() || request()->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'order_id' => $order->id,
                    'order' => $order->load(['customer', 'user', 'items', 'payments']),
                ]);
            }

            return redirect()->route('orders.show', $order)
                ->with('success', 'Order created successfully.')
                ->with('order_id', $order->id);
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function updateStatus(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,completed,cancelled,refunded',
        ]);

        $order->update(['status' => $validated['status']]);

        return redirect()->back()->with('success', 'Order status updated successfully.');
    }

    public function destroy(Order $order)
    {
        if ($order->status === 'completed') {
            return redirect()->back()->with('error', 'Cannot delete completed order.');
        }

        $order->delete();

        return redirect()->back()->with('success', 'Order deleted successfully.');
    }

    public function receipt(Order $order)
    {
        $order->load(['customer', 'user', 'items.product', 'payments']);

        $settings = [
            'store_name' => \App\Models\Setting::get('store_name', '24 Hour Store'),
            'store_address' => \App\Models\Setting::get('store_address', ''),
            'store_phone' => \App\Models\Setting::get('store_phone', ''),
            'receipt_header' => \App\Models\Setting::get('receipt_header', 'Thank you for your purchase!'),
            'receipt_footer' => \App\Models\Setting::get('receipt_footer', 'Have a great day!'),
            'receipt_logo' => \App\Models\Setting::get('receipt_logo', ''),
            'receipt_show_logo' => \App\Models\Setting::get('receipt_show_logo', false),
            'receipt_show_barcode' => \App\Models\Setting::get('receipt_show_barcode', false),
            'receipt_show_tax_details' => \App\Models\Setting::get('receipt_show_tax_details', true),
        ];

        return Inertia::render('orders/receipt', [
            'order' => $order,
            'settings' => $settings,
        ]);
    }
}

