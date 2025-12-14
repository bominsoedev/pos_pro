<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Customer extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'total_spent',
        'total_orders',
        'loyalty_points',
        'loyalty_tier',
    ];

    protected $casts = [
        'total_spent' => 'decimal:2',
        'total_orders' => 'integer',
        'loyalty_points' => 'integer',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function pointTransactions(): HasMany
    {
        return $this->hasMany(PointTransaction::class);
    }

    public function addPoints(int $points, string $type = 'earned', ?Order $order = null, ?string $description = null): PointTransaction
    {
        $this->increment('loyalty_points', $points);
        $this->updateTier();

        return PointTransaction::create([
            'customer_id' => $this->id,
            'order_id' => $order?->id,
            'type' => $type,
            'points' => $points,
            'description' => $description,
            'balance_after' => $this->loyalty_points,
        ]);
    }

    public function redeemPoints(int $points, ?string $description = null): PointTransaction
    {
        if ($this->loyalty_points < $points) {
            throw new \Exception('Insufficient points');
        }

        $this->decrement('loyalty_points', $points);
        $this->updateTier();

        return PointTransaction::create([
            'customer_id' => $this->id,
            'type' => 'redeemed',
            'points' => -$points,
            'description' => $description,
            'balance_after' => $this->loyalty_points,
        ]);
    }

    public function updateTier(): void
    {
        $tiers = [
            'bronze' => 0,
            'silver' => 1000,
            'gold' => 5000,
            'platinum' => 10000,
        ];

        $currentTier = 'bronze';
        foreach ($tiers as $tier => $minPoints) {
            if ($this->loyalty_points >= $minPoints) {
                $currentTier = $tier;
            }
        }

        $this->update(['loyalty_tier' => $currentTier]);
    }

    public function getTierMultiplier(): float
    {
        return match($this->loyalty_tier) {
            'bronze' => 1.0,
            'silver' => 1.1,
            'gold' => 1.2,
            'platinum' => 1.5,
            default => 1.0,
        };
    }
}

