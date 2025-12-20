<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class BankAccount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'account_id',
        'name',
        'bank_name',
        'account_name',
        'account_number',
        'account_type',
        'currency',
        'branch',
        'swift_code',
        'opening_balance',
        'current_balance',
        'last_reconciled_at',
        'last_reconciled_balance',
        'is_active',
        'description',
        'notes',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'current_balance' => 'decimal:2',
        'last_reconciled_at' => 'datetime',
        'last_reconciled_balance' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(BankTransaction::class);
    }

    public function reconciliations(): HasMany
    {
        return $this->hasMany(BankReconciliation::class);
    }

    /**
     * Get display name
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->bank_name . ' - ' . $this->account_number;
    }

    /**
     * Get the name attribute (fallback to account_name if name doesn't exist)
     */
    public function getNameAttribute($value): string
    {
        return $value ?? $this->attributes['account_name'] ?? 'Account';
    }

    /**
     * Update current balance
     */
    public function updateBalance(): void
    {
        $this->current_balance = $this->account->balance;
        $this->save();
    }
}
