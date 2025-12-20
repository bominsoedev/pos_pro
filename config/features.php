<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Feature Flags
    |--------------------------------------------------------------------------
    |
    | Enable or disable features based on your business needs.
    | Settings from database (Settings table) take priority over config/env.
    | You can manage features from Settings > Features page in the admin panel.
    |
    | Note: These are default values. The actual feature state is checked
    | via the feature_enabled() helper which checks Settings table first.
    |
    */

    'bundles' => env('FEATURE_BUNDLES', true),
    'loyalty' => env('FEATURE_LOYALTY', true),
    'ways' => env('FEATURE_WAYS', false), // Multi-location management
    'roles' => env('FEATURE_ROLES', false), // Role & permissions (if single user)
    'backup' => env('FEATURE_BACKUP', true),
    'suppliers' => env('FEATURE_SUPPLIERS', false), // If you don't track suppliers
    'purchase_orders' => env('FEATURE_PURCHASE_ORDERS', false), // If you don't use PO
    'expenses' => env('FEATURE_EXPENSES', false), // If you don't track expenses separately
    'tax_rates' => env('FEATURE_TAX_RATES', true), // Keep if you need multiple tax rates
    'quotations' => env('FEATURE_QUOTATIONS', false), // If you don't send quotations
    'stock_transfers' => env('FEATURE_STOCK_TRANSFERS', false), // If single location
    'gift_cards' => env('FEATURE_GIFT_CARDS', false), // If you don't use gift cards
    'currencies' => env('FEATURE_CURRENCIES', false), // If single currency
    'activity_logs' => env('FEATURE_ACTIVITY_LOGS', false), // If you don't need detailed logs
    'refunds' => env('FEATURE_REFUNDS', true), // Keep for order refunds
    'accounting' => env('FEATURE_ACCOUNTING', false), // Double-entry accounting system
];
