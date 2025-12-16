<?php

namespace App\Http\Controllers;

use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Way;
use App\Models\TaxRate;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class QuotationController extends Controller
{
    public function index(Request $request)
    {
        $query = Quotation::with(['customer', 'user', 'way']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('quotation_number', 'like', "%{$request->search}%")
                    ->orWhereHas('customer', function ($q) use ($request) {
                        $q->where('name', 'like', "%{$request->search}%");
                    });
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $quotations = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('quotations/index', [
            'quotations' => $quotations,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        $customers = Customer::orderBy('name')->get();
        $ways = Way::where('is_active', true)->orderBy('name')->get();
        $taxRate = TaxRate::where('is_default', true)->where('is_active', true)->first();
        $defaultTaxRate = $taxRate ? $taxRate->rate : 0;
        $products = Product::where('is_active', true)->orderBy('name')->get();

        return Inertia::render('quotations/create', [
            'customers' => $customers,
            'ways' => $ways,
            'defaultTaxRate' => $defaultTaxRate,
            'products' => $products,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'way_id' => 'nullable|exists:ways,id',
            'valid_until' => 'nullable|date|after:today',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $itemSubtotal = ($item['price'] * $item['quantity']) - ($item['discount'] ?? 0);
                $subtotal += $itemSubtotal;
            }

            $taxAmount = ($subtotal - ($validated['discount_amount'] ?? 0)) * ($validated['tax_rate'] ?? 0) / 100;
            $total = $subtotal - ($validated['discount_amount'] ?? 0) + $taxAmount;

            $quotation = Quotation::create([
                'user_id' => auth()->id(),
                'customer_id' => $validated['customer_id'] ?? null,
                'way_id' => $validated['way_id'] ?? null,
                'status' => 'draft',
                'valid_until' => $validated['valid_until'] ?? null,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $validated['discount_amount'] ?? 0,
                'total' => $total,
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                $itemSubtotal = ($item['price'] * $item['quantity']) - ($item['discount'] ?? 0);
                $itemTotal = $itemSubtotal;

                QuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'price' => $item['price'],
                    'quantity' => $item['quantity'],
                    'discount' => $item['discount'] ?? 0,
                    'subtotal' => $itemSubtotal,
                    'total' => $itemTotal,
                ]);
            }

            DB::commit();

            return redirect()->route('quotations.show', $quotation)
                ->with('success', __('messages.quotation_created'));
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function show(Quotation $quotation)
    {
        $quotation->load(['customer', 'user', 'way', 'items.product']);

        return Inertia::render('quotations/show', [
            'quotation' => $quotation,
        ]);
    }

    public function edit(Quotation $quotation)
    {
        if ($quotation->status !== 'draft') {
            return redirect()->back()->with('error', __('messages.quotation_cannot_edit'));
        }

        $quotation->load(['items.product']);
        $customers = Customer::orderBy('name')->get();
        $ways = Way::where('is_active', true)->orderBy('name')->get();
        $taxRate = TaxRate::where('is_default', true)->where('is_active', true)->first();
        $defaultTaxRate = $taxRate ? $taxRate->rate : 0;
        $products = Product::where('is_active', true)->with('category')->orderBy('name')->get();

        return Inertia::render('quotations/edit', [
            'quotation' => $quotation,
            'customers' => $customers,
            'ways' => $ways,
            'defaultTaxRate' => $defaultTaxRate,
            'products' => $products,
        ]);
    }

    public function update(Request $request, Quotation $quotation)
    {
        if ($quotation->status !== 'draft') {
            return redirect()->back()->with('error', __('messages.quotation_cannot_edit'));
        }

        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'way_id' => 'nullable|exists:ways,id',
            'valid_until' => 'nullable|date|after:today',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'terms' => 'nullable|string',
        ]);

        DB::beginTransaction();

        try {
            // Delete existing items
            $quotation->items()->delete();

            $subtotal = 0;
            foreach ($validated['items'] as $item) {
                $itemSubtotal = ($item['price'] * $item['quantity']) - ($item['discount'] ?? 0);
                $subtotal += $itemSubtotal;
            }

            $taxAmount = ($subtotal - ($validated['discount_amount'] ?? 0)) * ($validated['tax_rate'] ?? 0) / 100;
            $total = $subtotal - ($validated['discount_amount'] ?? 0) + $taxAmount;

            $quotation->update([
                'customer_id' => $validated['customer_id'] ?? null,
                'way_id' => $validated['way_id'] ?? null,
                'valid_until' => $validated['valid_until'] ?? null,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $validated['discount_amount'] ?? 0,
                'total' => $total,
                'notes' => $validated['notes'] ?? null,
                'terms' => $validated['terms'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                $product = Product::find($item['product_id']);
                $itemSubtotal = ($item['price'] * $item['quantity']) - ($item['discount'] ?? 0);
                $itemTotal = $itemSubtotal;

                QuotationItem::create([
                    'quotation_id' => $quotation->id,
                    'product_id' => $item['product_id'],
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'price' => $item['price'],
                    'quantity' => $item['quantity'],
                    'discount' => $item['discount'] ?? 0,
                    'subtotal' => $itemSubtotal,
                    'total' => $itemTotal,
                ]);
            }

            DB::commit();

            return redirect()->route('quotations.show', $quotation)
                ->with('success', __('messages.quotation_updated'));
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function destroy(Quotation $quotation)
    {
        if (!in_array($quotation->status, ['draft', 'rejected', 'expired'])) {
            return redirect()->back()->with('error', __('messages.quotation_cannot_delete'));
        }

        $quotation->delete();

        return redirect()->route('quotations.index')
            ->with('success', __('messages.quotation_deleted'));
    }

    public function send(Quotation $quotation)
    {
        $quotation->update([
            'status' => 'sent',
            'sent_at' => now(),
        ]);

        return redirect()->back()->with('success', __('messages.quotation_sent'));
    }

    public function convertToOrder(Quotation $quotation)
    {
        if (!$quotation->canConvert()) {
            return redirect()->back()->with('error', __('messages.quotation_cannot_convert'));
        }

        DB::beginTransaction();

        try {
            $order = \App\Models\Order::create([
                'user_id' => auth()->id(),
                'customer_id' => $quotation->customer_id,
                'way_id' => $quotation->way_id,
                'status' => 'pending',
                'payment_status' => 'pending',
                'subtotal' => $quotation->subtotal,
                'tax_amount' => $quotation->tax_amount,
                'discount_amount' => $quotation->discount_amount,
                'total' => $quotation->total,
                'notes' => $quotation->notes,
            ]);

            foreach ($quotation->items as $item) {
                $order->items()->create([
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'product_sku' => $item->product_sku,
                    'price' => $item->price,
                    'quantity' => $item->quantity,
                    'discount' => $item->discount,
                    'subtotal' => $item->subtotal,
                    'total' => $item->total,
                ]);
            }

            $quotation->update([
                'status' => 'converted',
                'converted_to_order_id' => $order->id,
                'converted_at' => now(),
            ]);

            DB::commit();

            return redirect()->route('orders.show', $order)
                ->with('success', __('messages.quotation_converted'));
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', $e->getMessage());
        }
    }
}
