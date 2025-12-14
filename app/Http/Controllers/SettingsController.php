<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function index()
    {
        $settings = [
            'app_name' => Setting::get('app_name', config('app.name', 'Laravel')),
            'tax_rate' => Setting::get('tax_rate', 0),
            'store_name' => Setting::get('store_name', '24 Hour Store'),
            'store_address' => Setting::get('store_address', ''),
            'store_phone' => Setting::get('store_phone', ''),
            'store_email' => Setting::get('store_email', ''),
            'receipt_header' => Setting::get('receipt_header', 'Thank you for your purchase!'),
            'receipt_footer' => Setting::get('receipt_footer', 'Have a great day!'),
            'receipt_logo' => Setting::get('receipt_logo', ''),
            'receipt_show_logo' => Setting::get('receipt_show_logo', false),
            'receipt_show_barcode' => Setting::get('receipt_show_barcode', false),
            'receipt_show_tax_details' => Setting::get('receipt_show_tax_details', true),
            'currency_symbol' => Setting::get('currency_symbol', 'K'),
            'low_stock_notification' => Setting::get('low_stock_notification', true),
        ];

        return Inertia::render('settings/pos', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'app_name' => 'required|string|max:255',
            'tax_rate' => 'required|numeric|min:0|max:100',
            'store_name' => 'required|string|max:255',
            'store_address' => 'nullable|string',
            'store_phone' => 'nullable|string|max:255',
            'store_email' => 'nullable|email|max:255',
            'receipt_header' => 'nullable|string',
            'receipt_footer' => 'nullable|string',
            'receipt_logo' => 'nullable|string',
            'receipt_show_logo' => 'boolean',
            'receipt_show_barcode' => 'boolean',
            'receipt_show_tax_details' => 'boolean',
            'currency_symbol' => 'nullable|string|max:10',
            'low_stock_notification' => 'boolean',
        ]);

        Setting::set('app_name', $validated['app_name'], 'string', 'Application name');
        Setting::set('tax_rate', $validated['tax_rate'], 'float', 'Tax rate percentage');
        Setting::set('store_name', $validated['store_name'], 'string', 'Store name');
        Setting::set('store_address', $validated['store_address'] ?? '', 'string', 'Store address');
        Setting::set('store_phone', $validated['store_phone'] ?? '', 'string', 'Store phone number');
        Setting::set('store_email', $validated['store_email'] ?? '', 'string', 'Store email');
        Setting::set('receipt_header', $validated['receipt_header'] ?? '', 'string', 'Receipt header text');
        Setting::set('receipt_footer', $validated['receipt_footer'] ?? '', 'string', 'Receipt footer text');
        Setting::set('receipt_logo', $validated['receipt_logo'] ?? '', 'string', 'Receipt logo URL');
        Setting::set('receipt_show_logo', $validated['receipt_show_logo'] ?? false, 'boolean', 'Show logo on receipt');
        Setting::set('receipt_show_barcode', $validated['receipt_show_barcode'] ?? false, 'boolean', 'Show barcode on receipt');
        Setting::set('receipt_show_tax_details', $validated['receipt_show_tax_details'] ?? true, 'boolean', 'Show tax details on receipt');
        Setting::set('currency_symbol', $validated['currency_symbol'] ?? 'K', 'string', 'Currency symbol');
        Setting::set('low_stock_notification', $validated['low_stock_notification'] ?? true, 'boolean', 'Enable low stock notifications');

        return redirect()->back()->with('success', 'Settings updated successfully.');
    }
}

