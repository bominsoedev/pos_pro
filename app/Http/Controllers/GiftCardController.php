<?php

namespace App\Http\Controllers;

use App\Models\GiftCard;
use App\Models\GiftCardTransaction;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class GiftCardController extends Controller
{
    public function index(Request $request)
    {
        $query = GiftCard::with(['customer', 'purchasedBy']);

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('card_number', 'like', "%{$request->search}%")
                    ->orWhere('pin_code', 'like', "%{$request->search}%")
                    ->orWhereHas('customer', function ($q) use ($request) {
                        $q->where('name', 'like', "%{$request->search}%");
                    });
            });
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $giftCards = $query->orderBy('created_at', 'desc')->paginate(20);

        return Inertia::render('gift-cards/index', [
            'giftCards' => $giftCards,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create()
    {
        $customers = Customer::orderBy('name')->get();

        return Inertia::render('gift-cards/create', [
            'customers' => $customers,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'initial_amount' => 'required|numeric|min:0',
            'customer_id' => 'nullable|exists:customers,id',
            'expires_at' => 'nullable|date|after:today',
            'notes' => 'nullable|string',
        ]);

        $giftCard = GiftCard::create([
            'initial_amount' => $validated['initial_amount'],
            'current_balance' => $validated['initial_amount'],
            'customer_id' => $validated['customer_id'] ?? null,
            'status' => 'active',
            'expires_at' => $validated['expires_at'] ?? null,
            'purchased_by' => auth()->id(),
            'notes' => $validated['notes'] ?? null,
        ]);

        GiftCardTransaction::create([
            'gift_card_id' => $giftCard->id,
            'type' => 'purchase',
            'amount' => $giftCard->initial_amount,
            'balance_after' => $giftCard->current_balance,
            'user_id' => auth()->id(),
            'description' => 'Gift card purchased',
        ]);

        return redirect()->route('gift-cards.show', $giftCard)
            ->with('success', __('messages.gift_card_created'));
    }

    public function show(GiftCard $giftCard)
    {
        $giftCard->load(['customer', 'purchasedBy', 'transactions.user', 'order']);

        return Inertia::render('gift-cards/show', [
            'giftCard' => $giftCard,
        ]);
    }

    public function redeem(Request $request, GiftCard $giftCard)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'order_id' => 'nullable|exists:orders,id',
            'description' => 'nullable|string',
        ]);

        try {
            $order = $validated['order_id'] ? \App\Models\Order::find($validated['order_id']) : null;
            $giftCard->redeem($validated['amount'], $order, $validated['description'] ?? null);

            return redirect()->back()->with('success', __('messages.gift_card_redeemed'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    public function destroy(GiftCard $giftCard)
    {
        if ($giftCard->status !== 'active' || $giftCard->current_balance > 0) {
            return redirect()->back()->with('error', __('messages.gift_card_cannot_delete'));
        }

        $giftCard->update(['status' => 'cancelled']);
        $giftCard->delete();

        return redirect()->route('gift-cards.index')
            ->with('success', __('messages.gift_card_deleted'));
    }
}
