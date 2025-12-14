<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SearchController extends Controller
{
    public function global(Request $request)
    {
        $query = $request->get('q', '');
        
        if (empty($query) || strlen($query) < 2) {
            return Inertia::render('search/results', [
                'query' => $query,
                'results' => [
                    'products' => [],
                    'customers' => [],
                    'orders' => [],
                    'categories' => [],
                ],
            ]);
        }

        $results = [
            'products' => Product::where('is_active', true)
                ->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                        ->orWhere('sku', 'like', "%{$query}%")
                        ->orWhere('barcode', 'like', "%{$query}%")
                        ->orWhere('description', 'like', "%{$query}%");
                })
                ->with('category')
                ->limit(10)
                ->get(),
            
            'customers' => Customer::where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%")
                        ->orWhere('phone', 'like', "%{$query}%");
                })
                ->limit(10)
                ->get(),
            
            'orders' => Order::where(function ($q) use ($query) {
                    $q->where('order_number', 'like', "%{$query}%")
                        ->orWhereHas('customer', function ($cq) use ($query) {
                            $cq->where('name', 'like', "%{$query}%");
                        });
                })
                ->with(['customer', 'user'])
                ->limit(10)
                ->get(),
            
            'categories' => Category::where('is_active', true)
                ->where(function ($q) use ($query) {
                    $q->where('name', 'like', "%{$query}%")
                        ->orWhere('description', 'like', "%{$query}%");
                })
                ->limit(10)
                ->get(),
        ];

        return Inertia::render('search/results', [
            'query' => $query,
            'results' => $results,
        ]);
    }

    public function quick(Request $request)
    {
        $query = $request->get('q', '');
        
        if (empty($query) || strlen($query) < 2) {
            return response()->json([]);
        }

        $results = [];

        // Products
        $products = Product::where('is_active', true)
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('sku', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get(['id', 'name', 'sku', 'price']);

        foreach ($products as $product) {
            $results[] = [
                'type' => 'product',
                'id' => $product->id,
                'title' => $product->name,
                'subtitle' => $product->sku,
                'url' => "/products/{$product->id}",
                'icon' => 'Package',
            ];
        }

        // Customers
        $customers = Customer::where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('phone', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get(['id', 'name', 'phone']);

        foreach ($customers as $customer) {
            $results[] = [
                'type' => 'customer',
                'id' => $customer->id,
                'title' => $customer->name,
                'subtitle' => $customer->phone,
                'url' => "/customers/{$customer->id}",
                'icon' => 'Users',
            ];
        }

        // Orders
        $orders = Order::where('order_number', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'order_number', 'total']);

        foreach ($orders as $order) {
            $results[] = [
                'type' => 'order',
                'id' => $order->id,
                'title' => $order->order_number,
                'subtitle' => 'Order',
                'url' => "/orders/{$order->id}",
                'icon' => 'Receipt',
            ];
        }

        return response()->json($results);
    }
}
