<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductBundle extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'name',
        'description',
        'bundle_price',
        'savings',
        'is_active',
    ];

    protected $casts = [
        'bundle_price' => 'decimal:2',
        'savings' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(BundleItem::class, 'bundle_id')->orderBy('display_order');
    }

    public function calculateSavings(): float
    {
        $totalIndividualPrice = $this->items->sum(function ($item) {
            return $item->product->price * $item->quantity;
        });

        return max(0, $totalIndividualPrice - $this->bundle_price);
    }

    public function updateSavings(): void
    {
        $this->savings = $this->calculateSavings();
        $this->save();
    }

    public function hasStock(): bool
    {
        foreach ($this->items as $item) {
            if ($item->product->track_inventory && $item->product->stock_quantity < $item->quantity) {
                return false;
            }
        }
        return true;
    }
}
