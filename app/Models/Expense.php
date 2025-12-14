<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'expense_number',
        'user_id',
        'category',
        'title',
        'description',
        'amount',
        'expense_date',
        'payment_method',
        'reference_number',
        'receipt',
        'is_recurring',
        'recurring_frequency',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'expense_date' => 'date',
        'is_recurring' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public static function generateExpenseNumber(): string
    {
        $lastExpense = self::latest('id')->first();
        $number = $lastExpense ? $lastExpense->id + 1 : 1;
        return 'EXP-' . str_pad($number, 6, '0', STR_PAD_LEFT);
    }
}
