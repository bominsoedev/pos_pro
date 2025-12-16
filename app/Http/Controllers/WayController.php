<?php

namespace App\Http\Controllers;

use App\Models\Way;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WayController extends Controller
{
    /**
     * Display a listing of the ways.
     */
    public function index(Request $request)
    {
        $query = Way::query();

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                    ->orWhere('code', 'like', "%{$request->search}%")
                    ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        if ($request->active_only) {
            $query->where('is_active', true);
        }

        $ways = $query->orderBy('sort_order')->orderBy('name')->get();

        return Inertia::render('ways/index', [
            'ways' => $ways,
            'filters' => $request->only(['search', 'active_only']),
        ]);
    }

    /**
     * Show the form for creating a new way.
     */
    public function create()
    {
        return Inertia::render('ways/create');
    }

    /**
     * Store a newly created way in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:ways,code',
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        Way::create($validated);

        return redirect()->back()
            ->with('success', __('messages.way_created'));
    }

    /**
     * Display the specified way.
     */
    public function show(Way $way)
    {
        $way->loadCount(['orders', 'products', 'customers']);

        return Inertia::render('ways/index', [
            'ways' => [$way],
            'filters' => [],
        ]);
    }

    /**
     * Show the form for editing the specified way.
     */
    public function edit(Way $way)
    {
        return Inertia::render('ways/edit', [
            'way' => $way,
        ]);
    }

    /**
     * Update the specified way in storage.
     */
    public function update(Request $request, Way $way)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:ways,code,' . $way->id,
            'description' => 'nullable|string',
            'address' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'is_active' => 'boolean',
            'sort_order' => 'integer|min:0',
        ]);

        $way->update($validated);

        return redirect()->back()
            ->with('success', __('messages.way_updated'));
    }

    /**
     * Remove the specified way from storage.
     */
    public function destroy(Way $way)
    {
        // Check if way has related records
        if ($way->orders()->count() > 0 || $way->products()->count() > 0 || $way->customers()->count() > 0) {
            return redirect()->back()
                ->with('error', __('messages.way_cannot_delete'));
        }

        $way->delete();

        return redirect()->back()
            ->with('success', __('messages.way_deleted'));
    }

    /**
     * Get all active ways for API/select
     */
    public function list()
    {
        $ways = Way::where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'description']);

        // Return JSON for API calls, or Inertia for page requests
        if (request()->wantsJson() || request()->expectsJson()) {
            return response()->json($ways);
        }

        return Inertia::render('ways/list', [
            'ways' => $ways,
        ]);
    }

    /**
     * Set current way in session
     */
    public function setCurrent(Request $request)
    {
        $validated = $request->validate([
            'way_id' => 'nullable|exists:ways,id',
        ]);

        if ($validated['way_id']) {
            $way = Way::findOrFail($validated['way_id']);
            session(['current_way_id' => $way->id]);
            session(['current_way_name' => $way->name]);
        } else {
            session()->forget(['current_way_id', 'current_way_name']);
        }

        return redirect()->back()->with('success', __('messages.way_selected'));
    }
}
