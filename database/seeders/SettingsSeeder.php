<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key' => 'tax_rate',
                'value' => '0',
                'type' => 'float',
                'description' => 'Tax rate percentage',
            ],
            [
                'key' => 'store_name',
                'value' => '24 Hour Store',
                'type' => 'string',
                'description' => 'Store name',
            ],
            [
                'key' => 'store_address',
                'value' => '',
                'type' => 'string',
                'description' => 'Store address',
            ],
            [
                'key' => 'store_phone',
                'value' => '',
                'type' => 'string',
                'description' => 'Store phone number',
            ],
            [
                'key' => 'store_email',
                'value' => '',
                'type' => 'string',
                'description' => 'Store email',
            ],
            [
                'key' => 'receipt_header',
                'value' => 'Thank you for your purchase!',
                'type' => 'string',
                'description' => 'Receipt header text',
            ],
            [
                'key' => 'receipt_footer',
                'value' => 'Have a great day!',
                'type' => 'string',
                'description' => 'Receipt footer text',
            ],
            [
                'key' => 'currency_symbol',
                'value' => 'K',
                'type' => 'string',
                'description' => 'Currency symbol',
            ],
            [
                'key' => 'low_stock_notification',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Enable low stock notifications',
            ],
        ];

        foreach ($settings as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}

