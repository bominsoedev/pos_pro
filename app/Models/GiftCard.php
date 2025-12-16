<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class GiftCard extends Model
{
    use HasFactory;

    protected $fillable = [
        'card_number',
        'pin_code',
        'initial_amount',
        'current_balance',
        'customer_id',
        'status',
        'expires_at',
        'purchased_by',
        'order_id',
        'notes',
    ];

    protected $casts = [
        'initial_amount' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'expires_at' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($giftCard) {
            if (empty($giftCard->card_number)) {
                $giftCard->card_number = 'GC-' . strtoupper(Str::random(12));
            }
            if (empty($giftCard->pin_code)) {
                $giftCard->pin_code = str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);
            }
            if (empty($giftCard->current_balance)) {
                $giftCard->current_balance = $giftCard->initial_amount;
            }
        });
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function purchasedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'purchased_by');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(GiftCardTransaction::class);
    }

    public function isExpired(): bool
    {
        if (!$this->expires_at) {
            return false;
        }
        return now()->gt($this->expires_at);
    }

    public function canRedeem(float $amount): bool
    {
        return $this->status === 'active' 
            && !$this->isExpired() 
            && $this->current_balance >= $amount;
    }

    public function redeem(float $amount, ?Order $order = null, ?string $description = null): GiftCardTransaction
    {
        if (!$this->canRedeem($amount)) {
            throw new \Exception('Cannot redeem gift card');
        }

        $this->decrement('current_balance', $amount);
        
        if ($this->current_balance <= 0) {
            $this->update(['status' => 'used']);
        }

        return GiftCardTransaction::create([
            'gift_card_id' => $this->id,
            'type' => 'redemption',
            'amount' => -$amount,
            'balance_after' => $this->current_balance,
            'order_id' => $order?->id,
            'user_id' => auth()->id(),
            'description' => $description ?? 'Gift card redemption',
        ]);
    }
}
