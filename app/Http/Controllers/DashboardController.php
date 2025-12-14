<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        $today = now()->startOfDay();
        $thisMonth = now()->startOfMonth();
        $lastMonth = now()->subMonth()->startOfMonth();

        $lowStockProducts = Product::where('track_inventory', true)
            ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->with('category')
            ->orderBy('stock_quantity', 'asc')
            ->limit(10)
            ->get();

        $stats = [
            'today' => [
                'sales' => Order::whereDate('created_at', $today)
                    ->where('status', 'completed')
                    ->sum('total'),
                'orders' => Order::whereDate('created_at', $today)->count(),
                'customers' => Customer::whereDate('created_at', $today)->count(),
            ],
            'this_month' => [
                'sales' => Order::where('created_at', '>=', $thisMonth)
                    ->where('status', 'completed')
                    ->sum('total'),
                'orders' => Order::where('created_at', '>=', $thisMonth)->count(),
                'customers' => Customer::where('created_at', '>=', $thisMonth)->count(),
            ],
            'last_month' => [
                'sales' => Order::whereBetween('created_at', [
                    $lastMonth,
                    $thisMonth->copy()->subDay()
                ])->where('status', 'completed')->sum('total'),
                'orders' => Order::whereBetween('created_at', [
                    $lastMonth,
                    $thisMonth->copy()->subDay()
                ])->count(),
            ],
            'low_stock' => Product::where('track_inventory', true)
                ->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
                ->count(),
            'total_products' => Product::count(),
            'total_customers' => Customer::count(),
        ];

        $recentOrders = Order::with(['customer', 'user'])
            ->latest()
            ->limit(10)
            ->get();

        $topProducts = Product::select('products.*', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->join('order_items', 'products.id', '=', 'order_items.product_id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'completed')
            ->where('orders.created_at', '>=', $thisMonth)
            ->groupBy('products.id')
            ->orderBy('total_sold', 'desc')
            ->limit(5)
            ->get();

        // Sales chart data (last 7 days)
        $salesChartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $daySales = Order::whereDate('created_at', $date)
                ->where('status', 'completed')
                ->sum('total');
            $dayOrders = Order::whereDate('created_at', $date)->count();
            
            $salesChartData[] = [
                'date' => $date->format('M d'),
                'sales' => $daySales,
                'orders' => $dayOrders,
            ];
        }

        // Monthly sales trend (last 6 months)
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $monthStart = $month->copy()->startOfMonth();
            $monthEnd = $month->copy()->endOfMonth();
            
            $monthSales = Order::whereBetween('created_at', [$monthStart, $monthEnd])
                ->where('status', 'completed')
                ->sum('total');
            $monthOrders = Order::whereBetween('created_at', [$monthStart, $monthEnd])->count();
            
            $monthlyTrend[] = [
                'month' => $month->format('M Y'),
                'sales' => $monthSales,
                'orders' => $monthOrders,
            ];
        }

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentOrders' => $recentOrders,
            'topProducts' => $topProducts,
            'lowStockProducts' => $lowStockProducts,
            'salesChartData' => $salesChartData,
            'monthlyTrend' => $monthlyTrend,
        ]);
    }
}

