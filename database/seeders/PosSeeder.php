<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PosSeeder extends Seeder
{
    public function run(): void
    {
        // Create Categories
        $electronics = Category::create([
            'name' => 'Electronics',
            'description' => 'Electronic devices and accessories',
            'is_active' => true,
        ]);

        $clothing = Category::create([
            'name' => 'Clothing',
            'description' => 'Apparel and fashion items',
            'is_active' => true,
        ]);

        $food = Category::create([
            'name' => 'Food & Beverages',
            'description' => 'Food items and drinks',
            'is_active' => true,
        ]);

        $books = Category::create([
            'name' => 'Books',
            'description' => 'Books and reading materials',
            'is_active' => true,
        ]);

        // Create Products
        $products = [
            [
                'name' => 'Laptop Computer',
                'sku' => 'LAP-001',
                'description' => 'High-performance laptop',
                'category_id' => $electronics->id,
                'price' => 999.99,
                'cost' => 700.00,
                'stock_quantity' => 15,
                'low_stock_threshold' => 5,
                'barcode' => '1234567890123',
                'is_active' => true,
                'track_inventory' => true,
            ],
            [
                'name' => 'Wireless Mouse',
                'sku' => 'MOU-001',
                'description' => 'Ergonomic wireless mouse',
                'category_id' => $electronics->id,
                'price' => 29.99,
                'cost' => 15.00,
                'stock_quantity' => 50,
                'low_stock_threshold' => 10,
                'barcode' => '1234567890124',
                'is_active' => true,
                'track_inventory' => true,
            ],
            [
                'name' => 'T-Shirt',
                'sku' => 'TSH-001',
                'description' => 'Cotton t-shirt',
                'category_id' => $clothing->id,
                'price' => 19.99,
                'cost' => 10.00,
                'stock_quantity' => 100,
                'low_stock_threshold' => 20,
                'barcode' => '1234567890125',
                'is_active' => true,
                'track_inventory' => true,
            ],
            [
                'name' => 'Jeans',
                'sku' => 'JEA-001',
                'description' => 'Classic blue jeans',
                'category_id' => $clothing->id,
                'price' => 49.99,
                'cost' => 25.00,
                'stock_quantity' => 75,
                'low_stock_threshold' => 15,
                'barcode' => '1234567890126',
                'is_active' => true,
                'track_inventory' => true,
            ],
            [
                'name' => 'Coffee',
                'sku' => 'COF-001',
                'description' => 'Premium coffee beans',
                'category_id' => $food->id,
                'price' => 12.99,
                'cost' => 6.00,
                'stock_quantity' => 200,
                'low_stock_threshold' => 50,
                'barcode' => '1234567890127',
                'is_active' => true,
                'track_inventory' => true,
            ],
            [
                'name' => 'Bottled Water',
                'sku' => 'WAT-001',
                'description' => 'Purified water',
                'category_id' => $food->id,
                'price' => 1.99,
                'cost' => 0.50,
                'stock_quantity' => 500,
                'low_stock_threshold' => 100,
                'barcode' => '1234567890128',
                'is_active' => true,
                'track_inventory' => true,
            ],
            [
                'name' => 'Programming Book',
                'sku' => 'BOK-001',
                'description' => 'Learn programming fundamentals',
                'category_id' => $books->id,
                'price' => 39.99,
                'cost' => 20.00,
                'stock_quantity' => 30,
                'low_stock_threshold' => 10,
                'barcode' => '1234567890129',
                'is_active' => true,
                'track_inventory' => true,
            ],
            [
                'name' => 'Keyboard',
                'sku' => 'KEY-001',
                'description' => 'Mechanical keyboard',
                'category_id' => $electronics->id,
                'price' => 79.99,
                'cost' => 40.00,
                'stock_quantity' => 25,
                'low_stock_threshold' => 5,
                'barcode' => '1234567890130',
                'is_active' => true,
                'track_inventory' => true,
            ],
        ];

        foreach ($products as $product) {
            Product::create($product);
        }

        // Create Sample Customers
        $customers = [
            [
                'name' => 'John Doe',
                'email' => 'john.doe@example.com',
                'phone' => '+1234567890',
                'address' => '123 Main St',
                'city' => 'New York',
                'state' => 'NY',
                'postal_code' => '10001',
                'country' => 'USA',
            ],
            [
                'name' => 'Jane Smith',
                'email' => 'jane.smith@example.com',
                'phone' => '+1234567891',
                'address' => '456 Oak Ave',
                'city' => 'Los Angeles',
                'state' => 'CA',
                'postal_code' => '90001',
                'country' => 'USA',
            ],
            [
                'name' => 'Bob Johnson',
                'email' => 'bob.johnson@example.com',
                'phone' => '+1234567892',
                'address' => '789 Pine Rd',
                'city' => 'Chicago',
                'state' => 'IL',
                'postal_code' => '60601',
                'country' => 'USA',
            ],
        ];

        foreach ($customers as $customer) {
            Customer::create($customer);
        }
    }
}

