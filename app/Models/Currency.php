<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Currency extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'name',
        'symbol',
        'decimal_places',
        'exchange_rate',
        'is_default',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'decimal_places' => 'integer',
        'exchange_rate' => 'decimal:4',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($currency) {
            if ($currency->is_default) {
                static::where('is_default', true)->update(['is_default' => false]);
            }
        });

        static::updating(function ($currency) {
            if ($currency->is_default) {
                static::where('id', '!=', $currency->id)
                    ->where('is_default', true)
                    ->update(['is_default' => false]);
            }
        });
    }

    public static function getDefault(): ?self
    {
        return static::where('is_default', true)->where('is_active', true)->first();
    }

    public function convertAmount(float $amount, ?self $toCurrency = null): float
    {
        if (!$toCurrency) {
            $toCurrency = static::getDefault();
        }

        if (!$toCurrency || $toCurrency->id === $this->id) {
            return $amount;
        }

        // Convert to base currency first, then to target currency
        $baseAmount = $amount / $this->exchange_rate;
        return $baseAmount * $toCurrency->exchange_rate;
    }
}
