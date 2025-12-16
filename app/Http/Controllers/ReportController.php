<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Payment;
use App\Models\User;
use App\Models\Customer;
use App\Models\Expense;
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

    public function profitLoss(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        
        $startDate = Carbon::parse($dateFrom)->startOfDay();
        $endDate = Carbon::parse($dateTo)->endOfDay();

        // Revenue (Sales)
        $orders = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->get();
        
        $revenue = $orders->sum('total');
        $costOfGoodsSold = 0;
        
        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $product = Product::find($item->product_id);
                if ($product && $product->cost) {
                    $costOfGoodsSold += $product->cost * $item->quantity;
                }
            }
        }

        // Expenses
        $expenses = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');

        $grossProfit = $revenue - $costOfGoodsSold;
        $netProfit = $grossProfit - $expenses;
        $grossMargin = $revenue > 0 ? ($grossProfit / $revenue) * 100 : 0;
        $netMargin = $revenue > 0 ? ($netProfit / $revenue) * 100 : 0;

        return Inertia::render('reports/profit-loss', [
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'revenue' => $revenue,
            'cost_of_goods_sold' => $costOfGoodsSold,
            'gross_profit' => $grossProfit,
            'expenses' => $expenses,
            'net_profit' => $netProfit,
            'gross_margin' => $grossMargin,
            'net_margin' => $netMargin,
            'total_orders' => $orders->count(),
        ]);
    }

    public function salesByEmployee(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->subMonth()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        
        $startDate = Carbon::parse($dateFrom)->startOfDay();
        $endDate = Carbon::parse($dateTo)->endOfDay();

        $employees = User::select(
                'users.*',
                DB::raw('COUNT(orders.id) as total_orders'),
                DB::raw('SUM(orders.total) as total_sales'),
                DB::raw('AVG(orders.total) as average_order_value')
            )
            ->join('orders', 'users.id', '=', 'orders.user_id')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->groupBy('users.id')
            ->orderBy('total_sales', 'desc')
            ->get();

        return Inertia::render('reports/sales-by-employee', [
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'employees' => $employees,
        ]);
    }

    public function customerAnalytics(Request $request)
    {
        $dateFrom = $request->get('date_from', now()->subYear()->format('Y-m-d'));
        $dateTo = $request->get('date_to', now()->format('Y-m-d'));
        
        $startDate = Carbon::parse($dateFrom)->startOfDay();
        $endDate = Carbon::parse($dateTo)->endOfDay();

        $customers = Customer::with(['orders' => function ($query) use ($startDate, $endDate) {
            $query->where('status', 'completed')
                ->whereBetween('created_at', [$startDate, $endDate]);
        }])
        ->whereHas('orders', function ($query) use ($startDate, $endDate) {
            $query->where('status', 'completed')
                ->whereBetween('created_at', [$startDate, $endDate]);
        })
        ->get()
        ->map(function ($customer) {
            $customerOrders = $customer->orders;
            return [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'total_orders' => $customerOrders->count(),
                'total_spent' => $customerOrders->sum('total'),
                'average_order_value' => $customerOrders->count() > 0 ? $customerOrders->sum('total') / $customerOrders->count() : 0,
                'lifetime_value' => $customer->total_spent,
                'loyalty_points' => $customer->loyalty_points,
                'loyalty_tier' => $customer->loyalty_tier,
                'last_order_date' => $customerOrders->max('created_at'),
            ];
        })
        ->sortByDesc('total_spent')
        ->values();

        return Inertia::render('reports/customer-analytics', [
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'customers' => $customers,
        ]);
    }

    public function inventoryValuation(Request $request)
    {
        $products = Product::where('track_inventory', true)
            ->with('category')
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'category' => $product->category?->name,
                    'stock_quantity' => $product->stock_quantity,
                    'cost' => $product->cost ?? 0,
                    'total_value' => ($product->cost ?? 0) * $product->stock_quantity,
                    'is_low_stock' => $product->isLowStock(),
                ];
            })
            ->sortByDesc('total_value')
            ->values();

        $totalValue = $products->sum('total_value');
        $lowStockValue = $products->where('is_low_stock', true)->sum('total_value');

        return Inertia::render('reports/inventory-valuation', [
            'products' => $products,
            'total_value' => $totalValue,
            'low_stock_value' => $lowStockValue,
            'total_items' => $products->count(),
            'low_stock_items' => $products->where('is_low_stock', true)->count(),
        ]);
    }
}
