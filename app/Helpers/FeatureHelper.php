<?php

use App\Models\Setting;
use Illuminate\Support\Facades\Schema;

if (!function_exists('feature_enabled')) {
    /**
     * Check if a feature is enabled
     * Checks Settings (database) first, then falls back to config/env
     */
    function feature_enabled(string $feature): bool
    {
        // Check Settings (database) first, but only if database is ready
        try {
            // Check if settings table exists and database connection is available
            if (Schema::hasTable('settings')) {
                $settingKey = "feature_{$feature}";
                $settingValue = Setting::get($settingKey);
                
                // If setting exists in database, use it
                if ($settingValue !== null) {
                    return (bool) $settingValue;
                }
            }
        } catch (\Exception $e) {
            // If database not ready (e.g., during migrations, config cache clear), fall back to config/env
            // Silently continue to fallback
        }
        
        // Otherwise, fall back to config/env
        return config("features.{$feature}", true);
    }
}
