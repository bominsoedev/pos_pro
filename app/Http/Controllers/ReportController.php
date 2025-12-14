<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    public function daily(Request $request)
    {
        $date = $request->get('date', now()->format('Y-m-d'));
        $startDate = Carbon::parse($date)->startOfDay();
        $endDate = Carbon::parse($date)->endOfDay();

        $orders = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->with(['items', 'payments', 'user'])
            ->get();

        $stats = [
            'total_sales' => $orders->sum('total'),
            'total_orders' => $orders->count(),
            'total_items' => $orders->sum(function ($order) {
                return $order->items->sum('quantity');
            }),
            'cash_sales' => Payment::whereHas('order', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('orders.created_at', [$startDate, $endDate])
                    ->where('orders.status', 'completed');
            })->where('method', 'cash')->sum('amount'),
            'card_sales' => Payment::whereHas('order', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('orders.created_at', [$startDate, $endDate])
                    ->where('orders.status', 'completed');
            })->where('method', 'card')->sum('amount'),
            'other_sales' => Payment::whereHas('order', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('orders.created_at', [$startDate, $endDate])
                    ->where('orders.status', 'completed');
            })->whereNotIn('method', ['cash', 'card'])->sum('amount'),
        ];

        $topProducts = Product::select('products.*', DB::raw('SUM(order_items.quantity) as total_sold'), DB::raw('SUM(order_items.total) as total_revenue'))
            ->join('order_items', 'products.id', '=', 'order_items.product_id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->groupBy('products.id')
            ->orderBy('total_sold', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('reports/daily', [
            'date' => $date,
            'stats' => $stats,
            'orders' => $orders,
            'topProducts' => $topProducts,
        ]);
    }

    public function monthly(Request $request)
    {
        $year = $request->get('year', now()->year);
        $month = $request->get('month', now()->month);
        
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $orders = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->get();

        $stats = [
            'total_sales' => $orders->sum('total'),
            'total_orders' => $orders->count(),
            'total_items' => $orders->sum(function ($order) {
                return $order->items->sum('quantity');
            }),
            'average_order_value' => $orders->count() > 0 ? $orders->sum('total') / $orders->count() : 0,
            'cash_sales' => Payment::whereHas('order', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('orders.created_at', [$startDate, $endDate])
                    ->where('orders.status', 'completed');
            })->where('method', 'cash')->sum('amount'),
            'card_sales' => Payment::whereHas('order', function ($query) use ($startDate, $endDate) {
                $query->whereBetween('orders.created_at', [$startDate, $endDate])
                    ->where('orders.status', 'completed');
            })->where('method', 'card')->sum('amount'),
        ];

        // Daily breakdown
        $dailyStats = [];
        for ($day = 1; $day <= $endDate->day; $day++) {
            $dayDate = $startDate->copy()->day($day);
            $dayOrders = Order::whereDate('created_at', $dayDate)
                ->where('status', 'completed')
                ->get();
            
            $dailyStats[] = [
                'date' => $dayDate->format('Y-m-d'),
                'sales' => $dayOrders->sum('total'),
                'orders' => $dayOrders->count(),
            ];
        }

        $topProducts = Product::select('products.*', DB::raw('SUM(order_items.quantity) as total_sold'), DB::raw('SUM(order_items.total) as total_revenue'))
            ->join('order_items', 'products.id', '=', 'order_items.product_id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->groupBy('products.id')
            ->orderBy('total_sold', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('reports/monthly', [
            'year' => $year,
            'month' => $month,
            'stats' => $stats,
            'dailyStats' => $dailyStats,
            'topProducts' => $topProducts,
        ]);
    }

    public function yearly(Request $request)
    {
        $year = $request->get('year', now()->year);
        
        $startDate = Carbon::create($year, 1, 1)->startOfYear();
        $endDate = $startDate->copy()->endOfYear();

        $orders = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->get();

        $stats = [
            'total_sales' => $orders->sum('total'),
            'total_orders' => $orders->count(),
            'total_items' => $orders->sum(function ($order) {
                return $order->items->sum('quantity');
            }),
            'average_order_value' => $orders->count() > 0 ? $orders->sum('total') / $orders->count() : 0,
        ];

        // Monthly breakdown
        $monthlyStats = [];
        for ($month = 1; $month <= 12; $month++) {
            $monthStart = $startDate->copy()->month($month)->startOfMonth();
            $monthEnd = $monthStart->copy()->endOfMonth();
            
            $monthOrders = Order::whereBetween('created_at', [$monthStart, $monthEnd])
                ->where('status', 'completed')
                ->get();
            
            $monthlyStats[] = [
                'month' => $month,
                'month_name' => $monthStart->format('F'),
                'sales' => $monthOrders->sum('total'),
                'orders' => $monthOrders->count(),
            ];
        }

        return Inertia::render('reports/yearly', [
            'year' => $year,
            'stats' => $stats,
            'monthlyStats' => $monthlyStats,
        ]);
    }

    public function productPerformance(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        $search = $request->get('search');
        
        $startDate = Carbon::parse($dateFrom)->startOfDay();
        $endDate = Carbon::parse($dateTo)->endOfDay();

        $query = Product::select(
                'products.*',
                DB::raw('SUM(order_items.quantity) as total_sold'),
                DB::raw('SUM(order_items.total) as total_revenue'),
                DB::raw('COUNT(DISTINCT orders.id) as order_count')
            )
            ->join('order_items', 'products.id', '=', 'order_items.product_id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->groupBy('products.id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('products.name', 'like', "%{$search}%")
                  ->orWhere('products.sku', 'like', "%{$search}%");
            });
        }

        $products = $query->orderBy('total_revenue', 'desc')->paginate(20);

        return Inertia::render('reports/product-performance', [
            'products' => $products,
            'filters' => $request->only(['date_from', 'date_to', 'search']),
        ]);
    }

    public function cashRegister(Request $request)
    {
        $date = $request->get('date', now()->format('Y-m-d'));
        $startDate = Carbon::parse($date)->startOfDay();
        $endDate = Carbon::parse($date)->endOfDay();

        $payments = Payment::whereHas('order', function ($query) use ($startDate, $endDate) {
            $query->whereBetween('orders.created_at', [$startDate, $endDate])
                ->where('orders.status', 'completed');
        })
            ->with(['order.user', 'order.customer'])
            ->orderBy('created_at', 'asc')
            ->get();

        $summary = [
            'cash' => $payments->where('method', 'cash')->sum('amount'),
            'card' => $payments->where('method', 'card')->sum('amount'),
            'mobile_payment' => $payments->where('method', 'mobile_payment')->sum('amount'),
            'bank_transfer' => $payments->where('method', 'bank_transfer')->sum('amount'),
            'other' => $payments->where('method', 'other')->sum('amount'),
            'total' => $payments->sum('amount'),
        ];

        return Inertia::render('reports/cash-register', [
            'date' => $date,
            'payments' => $payments,
            'summary' => $summary,
        ]);
    }
}
