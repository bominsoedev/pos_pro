<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\InventoryLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function create(Request $request)
    {
        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get();
        $products = \App\Models\Product::where('is_active', true)->with('category')->orderBy('name')->get();

        return Inertia::render('purchase-orders/create', [
            'suppliers' => $suppliers,
            'products' => $products,
        ]);
    }

    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['supplier', 'user', 'items.product']);

        if ($request->search) {
            $query->where('po_number', 'like', "%{$request->search}%");
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->supplier_id) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->date_from) {
            $query->whereDate('order_date', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('order_date', '<=', $request->date_to);
        }

        $purchaseOrders = $query->orderBy('created_at', 'desc')->paginate(20);
        $suppliers = Supplier::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('purchase-orders/index', [
            'purchaseOrders' => $purchaseOrders,
            'suppliers' => $suppliers,
            'filters' => $request->only(['search', 'status', 'supplier_id', 'date_from', 'date_to']),
        ]);
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load(['supplier', 'user', 'items.product']);

        return Inertia::render('purchase-orders/show', [
            'purchaseOrder' => $purchaseOrder,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date|after_or_equal:order_date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $subtotal = 0;
            $items = [];

            foreach ($validated['items'] as $itemData) {
                $product = Product::findOrFail($itemData['product_id']);
                $itemSubtotal = $itemData['unit_cost'] * $itemData['quantity'];
                $itemDiscount = $itemData['discount'] ?? 0;
                $itemTotal = $itemSubtotal - $itemDiscount;

                $subtotal += $itemTotal;

                $items[] = [
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $itemData['quantity'],
                    'unit_cost' => $itemData['unit_cost'],
                    'subtotal' => $itemSubtotal,
                    'discount' => $itemDiscount,
                    'total' => $itemTotal,
                ];
            }

            $taxAmount = $validated['tax_amount'] ?? 0;
            $discountAmount = $validated['discount_amount'] ?? 0;
            $total = $subtotal + $taxAmount - $discountAmount;

            $purchaseOrder = PurchaseOrder::create([
                'po_number' => PurchaseOrder::generatePoNumber(),
                'supplier_id' => $validated['supplier_id'],
                'user_id' => auth()->id(),
                'order_date' => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'status' => 'draft',
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'total' => $total,
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
            ]);

            foreach ($items as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $purchaseOrder->id,
                    ...$item,
                ]);
            }

            DB::commit();

            return redirect()->route('purchase-orders.show', $purchaseOrder)->with('success', 'Purchase order created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to create purchase order: ' . $e->getMessage());
        }
    }

    public function updateStatus(Request $request, PurchaseOrder $purchaseOrder)
    {
        $validated = $request->validate([
            'status' => 'required|in:draft,pending,approved,received,cancelled',
        ]);

        DB::beginTransaction();

        try {
            $oldStatus = $purchaseOrder->status;
            $purchaseOrder->update(['status' => $validated['status']]);

            // If status changed to 'received', update inventory
            if ($validated['status'] === 'received' && $oldStatus !== 'received') {
                foreach ($purchaseOrder->items as $item) {
                    $product = $item->product;
                    if ($product && $product->track_inventory) {
                        $product->increment('stock_quantity', $item->quantity);
                        $product->update(['cost' => $item->unit_cost]);

                        InventoryLog::create([
                            'product_id' => $product->id,
                            'type' => 'purchase',
                            'quantity' => $item->quantity,
                            'previous_quantity' => $product->stock_quantity - $item->quantity,
                            'new_quantity' => $product->stock_quantity,
                            'notes' => "Purchase Order: {$purchaseOrder->po_number}",
                        ]);
                    }
                }
            }

            DB::commit();

            return redirect()->back()->with('success', 'Purchase order status updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to update status: ' . $e->getMessage());
        }
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status === 'received') {
            return redirect()->back()->with('error', 'Cannot delete received purchase order.');
        }

        $purchaseOrder->delete();

        return redirect()->route('purchase-orders.index')->with('success', 'Purchase order deleted successfully.');
    }
}
