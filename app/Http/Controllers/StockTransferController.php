<?php

namespace App\Http\Controllers;

use App\Models\StockTransfer;
use App\Models\StockTransferItem;
use App\Models\Product;
use App\Models\Way;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class StockTransferController extends Controller
{
    public function index(Request $request)
    {
        $query = StockTransfer::with(['fromWay', 'toWay', 'user']);
        $ways = Way::where('is_active', true)->orderBy('name')->get();

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('transfer_number', 'like', "%{$request->search}%");
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->from_way_id) {
            $query->where('from_way_id', $request->from_way_id);
        }

        if ($request->to_way_id) {
            $query->where('to_way_id', $request->to_way_id);
        }

        $transfers = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('stock-transfers/index', [
            'transfers' => $transfers,
            'ways' => $ways,
            'filters' => $request->only(['search', 'status', 'from_way_id', 'to_way_id']),
        ]);
    }

    public function create()
    {
        $ways = Way::where('is_active', true)->orderBy('name')->get();
        $products = Product::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('stock-transfers/create', [
            'ways' => $ways,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'from_way_id' => 'required|exists:ways,id',
            'to_way_id' => 'required|exists:ways,id|different:from_way_id',
            'transfer_date' => 'required|date',
            'expected_date' => 'nullable|date|after:transfer_date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity_requested' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $transfer = StockTransfer::create([
                'from_way_id' => $validated['from_way_id'],
                'to_way_id' => $validated['to_way_id'],
                'user_id' => auth()->id(),
                'status' => 'pending',
                'transfer_date' => $validated['transfer_date'],
                'expected_date' => $validated['expected_date'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                StockTransferItem::create([
                    'stock_transfer_id' => $transfer->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity_requested' => $item['quantity_requested'],
                    'quantity_transferred' => 0,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            DB::commit();

            return redirect()->route('stock-transfers.show', $transfer)
                ->with('success', __('messages.stock_transfer_created'));
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function show(StockTransfer $stockTransfer)
    {
        $stockTransfer->load(['fromWay', 'toWay', 'user', 'approvedBy', 'items.product']);

        return Inertia::render('stock-transfers/show', [
            'transfer' => $stockTransfer,
        ]);
    }

    public function approve(Request $request, StockTransfer $stockTransfer)
    {
        if ($stockTransfer->status !== 'pending') {
            return redirect()->back()->with('error', __('messages.stock_transfer_cannot_approve'));
        }

        $stockTransfer->update([
            'status' => 'approved',
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        return redirect()->back()->with('success', __('messages.stock_transfer_approved'));
    }

    public function complete(Request $request, StockTransfer $stockTransfer)
    {
        if ($stockTransfer->status !== 'approved') {
            return redirect()->back()->with('error', __('messages.stock_transfer_cannot_complete'));
        }

        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:stock_transfer_items,id',
            'items.*.quantity_transferred' => 'required|integer|min:0',
        ]);

        DB::beginTransaction();

        try {
            foreach ($validated['items'] as $itemData) {
                $item = StockTransferItem::find($itemData['id']);
                $quantityTransferred = $itemData['quantity_transferred'];

                if ($quantityTransferred > $item->quantity_requested) {
                    throw new \Exception("Transferred quantity cannot exceed requested quantity for {$item->product_name}");
                }

                // Update product stock at from_way (decrease)
                $product = Product::find($item->product_id);
                if ($product->track_inventory) {
                    if ($product->stock_quantity < $quantityTransferred) {
                        throw new \Exception("Insufficient stock for {$product->name}");
                    }

                    $product->decrement('stock_quantity', $quantityTransferred);

                    // Create inventory log for from_way
                    \App\Models\InventoryLog::create([
                        'product_id' => $product->id,
                        'user_id' => auth()->id(),
                        'type' => 'transfer_out',
                        'quantity_change' => -$quantityTransferred,
                        'quantity_before' => $product->stock_quantity + $quantityTransferred,
                        'quantity_after' => $product->stock_quantity,
                        'notes' => "Stock transfer #{$stockTransfer->transfer_number} to {$stockTransfer->toWay->name}",
                    ]);
                }

                $item->update([
                    'quantity_transferred' => $quantityTransferred,
                ]);
            }

            $stockTransfer->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            DB::commit();

            return redirect()->back()->with('success', __('messages.stock_transfer_completed'));
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function destroy(StockTransfer $stockTransfer)
    {
        if (!in_array($stockTransfer->status, ['pending', 'cancelled'])) {
            return redirect()->back()->with('error', __('messages.stock_transfer_cannot_delete'));
        }

        $stockTransfer->delete();

        return redirect()->route('stock-transfers.index')
            ->with('success', __('messages.stock_transfer_deleted'));
    }
}
