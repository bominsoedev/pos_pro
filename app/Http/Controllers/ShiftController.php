<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class ShiftController extends Controller
{
    public function index(Request $request)
    {
        $query = Shift::with('user');

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->date_from) {
            $query->whereDate('opened_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('opened_at', '<=', $request->date_to);
        }

        $shifts = $query->orderBy('opened_at', 'desc')->paginate(20);

        // Get current open shift
        $currentShift = Shift::where('status', 'open')
            ->where('user_id', auth()->id())
            ->latest('opened_at')
            ->first();

        return Inertia::render('shifts/index', [
            'shifts' => $shifts,
            'currentShift' => $currentShift,
            'filters' => $request->only(['status', 'user_id', 'date_from', 'date_to']),
        ]);
    }

    public function store(Request $request)
    {
        // Check if user has an open shift
        $existingShift = Shift::where('status', 'open')
            ->where('user_id', auth()->id())
            ->first();

        if ($existingShift) {
            return redirect()->back()->with('error', 'You already have an open shift. Please close it first.');
        }

        $validated = $request->validate([
            'opening_cash' => 'required|numeric|min:0',
            'opening_notes' => 'nullable|string',
        ]);

        $shift = Shift::create([
            'user_id' => auth()->id(),
            'status' => 'open',
            'opened_at' => now(),
            'opening_cash' => $validated['opening_cash'],
            'opening_notes' => $validated['opening_notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Shift opened successfully.');
    }

    public function close(Request $request, Shift $shift)
    {
        if ($shift->status === 'closed') {
            return redirect()->back()->with('error', 'This shift is already closed.');
        }

        if ($shift->user_id !== auth()->id()) {
            return redirect()->back()->with('error', 'You can only close your own shift.');
        }

        $validated = $request->validate([
            'closing_cash' => 'required|numeric|min:0',
            'closing_notes' => 'nullable|string',
        ]);

        $shift->closing_cash = $validated['closing_cash'];
        $shift->closing_notes = $validated['closing_notes'] ?? null;
        $shift->closed_at = now();
        $shift->status = 'closed';

        // Calculate totals
        $shift->calculateTotals();

        return redirect()->back()->with('success', 'Shift closed successfully.');
    }

    public function show(Shift $shift)
    {
        $shift->load('user');
        $shift->calculateTotals();

        // Get orders for this shift
        $orders = Order::where('user_id', $shift->user_id)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$shift->opened_at, $shift->closed_at ?? now()])
            ->with(['customer', 'items', 'payments'])
            ->orderBy('created_at', 'desc')
            ->get();

        // Get payment breakdown
        $paymentBreakdown = Payment::whereHas('order', function ($query) use ($shift) {
            $query->where('user_id', $shift->user_id)
                ->where('status', 'completed')
                ->whereBetween('orders.created_at', [$shift->opened_at, $shift->closed_at ?? now()]);
        })
        ->select('method', DB::raw('SUM(amount) as total'))
        ->groupBy('method')
        ->get();

        return Inertia::render('shifts/show', [
            'shift' => $shift,
            'orders' => $orders,
            'paymentBreakdown' => $paymentBreakdown,
        ]);
    }

    public function current()
    {
        $shift = Shift::where('status', 'open')
            ->where('user_id', auth()->id())
            ->latest('opened_at')
            ->first();

        if (!$shift) {
            return redirect()->route('shifts.index')->with('error', 'No open shift found.');
        }

        $shift->calculateTotals();

        return Inertia::render('shifts/current', [
            'shift' => $shift,
        ]);
    }
}
