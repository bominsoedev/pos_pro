<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeaturesController extends Controller
{
    public function index()
    {
        $features = [
            'bundles' => Setting::get('feature_bundles', config('features.bundles', true)),
            'loyalty' => Setting::get('feature_loyalty', config('features.loyalty', true)),
            'ways' => Setting::get('feature_ways', config('features.ways', false)),
            'roles' => Setting::get('feature_roles', config('features.roles', false)),
            'backup' => Setting::get('feature_backup', config('features.backup', true)),
            'suppliers' => Setting::get('feature_suppliers', config('features.suppliers', false)),
            'purchase_orders' => Setting::get('feature_purchase_orders', config('features.purchase_orders', false)),
            'expenses' => Setting::get('feature_expenses', config('features.expenses', false)),
            'tax_rates' => Setting::get('feature_tax_rates', config('features.tax_rates', true)),
            'quotations' => Setting::get('feature_quotations', config('features.quotations', false)),
            'stock_transfers' => Setting::get('feature_stock_transfers', config('features.stock_transfers', false)),
            'gift_cards' => Setting::get('feature_gift_cards', config('features.gift_cards', false)),
            'currencies' => Setting::get('feature_currencies', config('features.currencies', false)),
            'activity_logs' => Setting::get('feature_activity_logs', config('features.activity_logs', false)),
            'refunds' => Setting::get('feature_refunds', config('features.refunds', true)),
            'accounting' => Setting::get('feature_accounting', config('features.accounting', false)),
        ];

        return Inertia::render('settings/features', [
            'features' => $features,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'bundles' => 'boolean',
            'loyalty' => 'boolean',
            'ways' => 'boolean',
            'roles' => 'boolean',
            'backup' => 'boolean',
            'suppliers' => 'boolean',
            'purchase_orders' => 'boolean',
            'expenses' => 'boolean',
            'tax_rates' => 'boolean',
            'quotations' => 'boolean',
            'stock_transfers' => 'boolean',
            'gift_cards' => 'boolean',
            'currencies' => 'boolean',
            'activity_logs' => 'boolean',
            'refunds' => 'boolean',
            'accounting' => 'boolean',
        ]);

        $featureDescriptions = [
            'bundles' => 'Product bundles with special pricing',
            'loyalty' => 'Customer loyalty program with points and tiers',
            'ways' => 'Multi-location/way management',
            'roles' => 'Role and permission management',
            'backup' => 'Database backup and restore functionality',
            'suppliers' => 'Supplier management',
            'purchase_orders' => 'Purchase order management',
            'expenses' => 'Expense tracking',
            'tax_rates' => 'Multiple tax rate management',
            'quotations' => 'Quotation/quote management',
            'stock_transfers' => 'Stock transfer between locations',
            'gift_cards' => 'Gift card management',
            'currencies' => 'Multi-currency support',
            'activity_logs' => 'Detailed activity logging',
            'refunds' => 'Order refund management',
            'accounting' => 'Double-entry accounting system',
        ];

        // First, clear existing caches before setting new values
        foreach (array_keys($validated) as $feature) {
            \Illuminate\Support\Facades\Cache::forget("settings.feature_{$feature}");
        }

        foreach ($validated as $feature => $value) {
            Setting::set(
                "feature_{$feature}",
                $value ? '1' : '0',
                'boolean',
                $featureDescriptions[$feature] ?? "Enable/disable {$feature} feature"
            );
        }

        return redirect()->back()->with('success', 'Features updated successfully.');
    }
}
