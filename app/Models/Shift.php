<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'shift_number',
        'status',
        'opened_at',
        'closed_at',
        'opening_cash',
        'closing_cash',
        'expected_cash',
        'cash_difference',
        'total_sales',
        'total_orders',
        'opening_notes',
        'closing_notes',
    ];

    protected $casts = [
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
        'opening_cash' => 'decimal:2',
        'closing_cash' => 'decimal:2',
        'expected_cash' => 'decimal:2',
        'cash_difference' => 'decimal:2',
        'total_sales' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($shift) {
            if (empty($shift->shift_number)) {
                $shift->shift_number = 'SHIFT-' . str_pad(
                    (static::max('id') ?? 0) + 1,
                    6,
                    '0',
                    STR_PAD_LEFT
                );
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class, 'user_id', 'user_id')
            ->whereBetween('created_at', [$this->opened_at, $this->closed_at ?? now()]);
    }

    public function calculateTotals()
    {
        $orders = Order::where('user_id', $this->user_id)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$this->opened_at, $this->closed_at ?? now()])
            ->get();

        $this->total_sales = $orders->sum('total');
        $this->total_orders = $orders->count();
        
        // Calculate expected cash (opening cash + cash sales)
        $cashSales = Payment::whereHas('order', function ($query) {
            $query->where('user_id', $this->user_id)
                ->where('status', 'completed')
                ->whereBetween('orders.created_at', [$this->opened_at, $this->closed_at ?? now()]);
        })
        ->where('method', 'cash')
        ->sum('amount');

        $this->expected_cash = $this->opening_cash + $cashSales;
        
        if ($this->closing_cash !== null) {
            $this->cash_difference = $this->closing_cash - $this->expected_cash;
        }

        $this->save();
    }
}
