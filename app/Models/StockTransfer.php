<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_number',
        'from_way_id',
        'to_way_id',
        'user_id',
        'status',
        'transfer_date',
        'expected_date',
        'notes',
        'approved_by',
        'approved_at',
        'completed_at',
    ];

    protected $casts = [
        'transfer_date' => 'date',
        'expected_date' => 'date',
        'approved_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($transfer) {
            if (empty($transfer->transfer_number)) {
                $transfer->transfer_number = 'TRF-' . str_pad(
                    (static::max('id') ?? 0) + 1,
                    6,
                    '0',
                    STR_PAD_LEFT
                );
            }
        });
    }

    public function fromWay(): BelongsTo
    {
        return $this->belongsTo(Way::class, 'from_way_id');
    }

    public function toWay(): BelongsTo
    {
        return $this->belongsTo(Way::class, 'to_way_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockTransferItem::class);
    }
}
