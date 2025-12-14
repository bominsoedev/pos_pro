<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'sku',
        'name',
        'price',
        'cost',
        'stock_quantity',
        'barcode',
        'image',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'cost' => 'decimal:2',
        'stock_quantity' => 'integer',
        'is_active' => 'boolean',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function options(): BelongsToMany
    {
        return $this->belongsToMany(VariantOption::class, 'product_variant_option');
    }

    public function getDisplayName(): string
    {
        if ($this->name) {
            return $this->name;
        }

        $options = $this->options()->orderBy('display_order')->get();
        if ($options->isNotEmpty()) {
            return $options->pluck('value')->join(' - ');
        }

        return $this->product->name;
    }

    public function getPrice(): float
    {
        return $this->price ?? $this->product->price;
    }
}
