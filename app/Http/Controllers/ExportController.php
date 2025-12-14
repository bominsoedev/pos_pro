<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ExportController extends Controller
{
    public function ordersCsv(Request $request)
    {
        $query = Order::with(['customer', 'user', 'items']);

        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        $filename = 'orders_' . now()->format('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($orders) {
            $file = fopen('php://output', 'w');
            
            // Header
            fputcsv($file, [
                'Order Number',
                'Date',
                'Customer',
                'Cashier',
                'Status',
                'Payment Status',
                'Subtotal',
                'Tax',
                'Discount',
                'Total',
                'Items Count',
            ]);

            // Data
            foreach ($orders as $order) {
                fputcsv($file, [
                    $order->order_number,
                    $order->created_at->format('Y-m-d H:i:s'),
                    $order->customer?->name ?? 'Walk-in',
                    $order->user?->name ?? '-',
                    $order->status,
                    $order->payment_status,
                    number_format($order->subtotal, 2),
                    number_format($order->tax_amount, 2),
                    number_format($order->discount_amount, 2),
                    number_format($order->total, 2),
                    $order->items->sum('quantity'),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function productsCsv(Request $request)
    {
        $query = Product::with('category');

        if ($request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->low_stock) {
            $query->whereColumn('stock_quantity', '<=', 'low_stock_threshold');
        }

        $products = $query->orderBy('name')->get();

        $filename = 'products_' . now()->format('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($products) {
            $file = fopen('php://output', 'w');
            
            // Header
            fputcsv($file, [
                'Name',
                'SKU',
                'Category',
                'Price',
                'Cost',
                'Stock Quantity',
                'Low Stock Threshold',
                'Barcode',
                'Active',
                'Track Inventory',
            ]);

            // Data
            foreach ($products as $product) {
                fputcsv($file, [
                    $product->name,
                    $product->sku ?? '',
                    $product->category?->name ?? '',
                    number_format($product->price, 2),
                    $product->cost ? number_format($product->cost, 2) : '',
                    $product->stock_quantity,
                    $product->low_stock_threshold,
                    $product->barcode ?? '',
                    $product->is_active ? 'Yes' : 'No',
                    $product->track_inventory ? 'Yes' : 'No',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function dailyReportCsv(Request $request)
    {
        $date = $request->get('date', now()->format('Y-m-d'));
        $startDate = Carbon::parse($date)->startOfDay();
        $endDate = Carbon::parse($date)->endOfDay();

        $orders = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->with(['items', 'payments'])
            ->get();

        $filename = 'daily_report_' . $date . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($orders, $date) {
            $file = fopen('php://output', 'w');
            
            // Header
            fputcsv($file, ['Daily Sales Report - ' . $date]);
            fputcsv($file, []); // Empty row
            
            fputcsv($file, [
                'Order Number',
                'Time',
                'Customer',
                'Items',
                'Subtotal',
                'Tax',
                'Discount',
                'Total',
                'Payment Method',
            ]);

            $totalSales = 0;
            $totalItems = 0;

            // Data
            foreach ($orders as $order) {
                $itemCount = $order->items->sum('quantity');
                $totalItems += $itemCount;
                $totalSales += $order->total;

                fputcsv($file, [
                    $order->order_number,
                    $order->created_at->format('H:i:s'),
                    $order->customer?->name ?? 'Walk-in',
                    $itemCount,
                    number_format($order->subtotal, 2),
                    number_format($order->tax_amount, 2),
                    number_format($order->discount_amount, 2),
                    number_format($order->total, 2),
                    $order->payments->first()?->method ?? '-',
                ]);
            }

            fputcsv($file, []); // Empty row
            fputcsv($file, ['Total Orders', $orders->count()]);
            fputcsv($file, ['Total Items', $totalItems]);
            fputcsv($file, ['Total Sales', number_format($totalSales, 2)]);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function productPerformanceCsv(Request $request)
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

        $products = $query->orderBy('total_revenue', 'desc')->get();

        $filename = 'product_performance_' . now()->format('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($products, $dateFrom, $dateTo) {
            $file = fopen('php://output', 'w');
            
            // Header
            fputcsv($file, ['Product Performance Report']);
            fputcsv($file, ['Period: ' . $dateFrom . ' to ' . $dateTo]);
            fputcsv($file, []); // Empty row
            
            fputcsv($file, [
                'Product Name',
                'SKU',
                'Price',
                'Quantity Sold',
                'Total Revenue',
                'Orders',
                'Average per Order',
            ]);

            // Data
            foreach ($products as $product) {
                $avgPerOrder = $product->order_count > 0 
                    ? $product->total_revenue / $product->order_count 
                    : 0;
                    
                fputcsv($file, [
                    $product->name,
                    $product->sku ?? '',
                    number_format($product->price, 2),
                    $product->total_sold,
                    number_format($product->total_revenue, 2),
                    $product->order_count,
                    number_format($avgPerOrder, 2),
                ]);
            }

            fputcsv($file, []); // Empty row
            fputcsv($file, ['Total Products', $products->count()]);
            fputcsv($file, ['Total Revenue', number_format($products->sum('total_revenue'), 2)]);
            fputcsv($file, ['Total Quantity Sold', $products->sum('total_sold')]);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function monthlyReportCsv(Request $request)
    {
        $year = $request->get('year', now()->year);
        $month = $request->get('month', now()->month);
        
        $startDate = Carbon::create($year, $month, 1)->startOfMonth();
        $endDate = $startDate->copy()->endOfMonth();

        $orders = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->with(['items', 'payments', 'customer'])
            ->get();

        $filename = 'monthly_report_' . $year . '_' . str_pad($month, 2, '0', STR_PAD_LEFT) . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($orders, $year, $month) {
            $file = fopen('php://output', 'w');
            
            $monthName = Carbon::create($year, $month, 1)->format('F Y');
            
            // Header
            fputcsv($file, ['Monthly Sales Report - ' . $monthName]);
            fputcsv($file, []); // Empty row
            
            fputcsv($file, [
                'Order Number',
                'Date',
                'Customer',
                'Items',
                'Subtotal',
                'Tax',
                'Discount',
                'Total',
                'Payment Method',
            ]);

            $totalSales = 0;
            $totalItems = 0;

            // Data
            foreach ($orders as $order) {
                $itemCount = $order->items->sum('quantity');
                $totalItems += $itemCount;
                $totalSales += $order->total;

                fputcsv($file, [
                    $order->order_number,
                    $order->created_at->format('Y-m-d H:i:s'),
                    $order->customer?->name ?? 'Walk-in',
                    $itemCount,
                    number_format($order->subtotal, 2),
                    number_format($order->tax_amount, 2),
                    number_format($order->discount_amount, 2),
                    number_format($order->total, 2),
                    $order->payments->first()?->method ?? '-',
                ]);
            }

            fputcsv($file, []); // Empty row
            fputcsv($file, ['Total Orders', $orders->count()]);
            fputcsv($file, ['Total Items', $totalItems]);
            fputcsv($file, ['Total Sales', number_format($totalSales, 2)]);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function yearlyReportCsv(Request $request)
    {
        $year = $request->get('year', now()->year);
        
        $startDate = Carbon::create($year, 1, 1)->startOfYear();
        $endDate = $startDate->copy()->endOfYear();

        $orders = Order::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->with(['items', 'payments', 'customer'])
            ->get();

        $filename = 'yearly_report_' . $year . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($orders, $year) {
            $file = fopen('php://output', 'w');
            
            // Header
            fputcsv($file, ['Yearly Sales Report - ' . $year]);
            fputcsv($file, []); // Empty row
            
            fputcsv($file, [
                'Month',
                'Orders',
                'Items Sold',
                'Total Sales',
                'Average Order Value',
            ]);

            $totalSales = 0;
            $totalOrders = 0;
            $totalItems = 0;

            // Monthly breakdown
            for ($month = 1; $month <= 12; $month++) {
                $monthStart = Carbon::create($year, $month, 1)->startOfMonth();
                $monthEnd = $monthStart->copy()->endOfMonth();
                
                $monthOrders = $orders->filter(function ($order) use ($monthStart, $monthEnd) {
                    return $order->created_at >= $monthStart && $order->created_at <= $monthEnd;
                });
                
                $monthSales = $monthOrders->sum('total');
                $monthItems = $monthOrders->sum(function ($order) {
                    return $order->items->sum('quantity');
                });
                $monthOrderCount = $monthOrders->count();
                $avgOrderValue = $monthOrderCount > 0 ? $monthSales / $monthOrderCount : 0;
                
                $totalSales += $monthSales;
                $totalOrders += $monthOrderCount;
                $totalItems += $monthItems;
                
                fputcsv($file, [
                    $monthStart->format('F'),
                    $monthOrderCount,
                    $monthItems,
                    number_format($monthSales, 2),
                    number_format($avgOrderValue, 2),
                ]);
            }

            fputcsv($file, []); // Empty row
            fputcsv($file, ['Total', $totalOrders, $totalItems, number_format($totalSales, 2), number_format($totalOrders > 0 ? $totalSales / $totalOrders : 0, 2)]);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function cashRegisterCsv(Request $request)
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

        $filename = 'cash_register_' . $date . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function() use ($payments, $date) {
            $file = fopen('php://output', 'w');
            
            // Header
            fputcsv($file, ['Cash Register Report - ' . $date]);
            fputcsv($file, []); // Empty row
            
            fputcsv($file, [
                'Time',
                'Order Number',
                'Customer',
                'Cashier',
                'Payment Method',
                'Amount',
            ]);

            $summary = [
                'cash' => 0,
                'card' => 0,
                'mobile_payment' => 0,
                'bank_transfer' => 0,
                'other' => 0,
                'total' => 0,
            ];

            // Data
            foreach ($payments as $payment) {
                $summary[$payment->method] = ($summary[$payment->method] ?? 0) + $payment->amount;
                $summary['total'] += $payment->amount;

                fputcsv($file, [
                    $payment->created_at->format('H:i:s'),
                    $payment->order->order_number,
                    $payment->order->customer?->name ?? 'Walk-in',
                    $payment->order->user?->name ?? '-',
                    ucfirst(str_replace('_', ' ', $payment->method)),
                    number_format($payment->amount, 2),
                ]);
            }

            fputcsv($file, []); // Empty row
            fputcsv($file, ['Summary']);
            fputcsv($file, ['Cash', number_format($summary['cash'], 2)]);
            fputcsv($file, ['Card', number_format($summary['card'], 2)]);
            fputcsv($file, ['Mobile Payment', number_format($summary['mobile_payment'], 2)]);
            fputcsv($file, ['Bank Transfer', number_format($summary['bank_transfer'], 2)]);
            fputcsv($file, ['Other', number_format($summary['other'], 2)]);
            fputcsv($file, ['Total', number_format($summary['total'], 2)]);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

