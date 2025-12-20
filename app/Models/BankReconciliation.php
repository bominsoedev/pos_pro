<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BankReconciliation extends Model
{
    use HasFactory;

    protected $fillable = [
        'bank_account_id',
        'statement_date',
        'statement_balance',
        'gl_balance',
        'difference',
        'status',
        'completed_by',
        'completed_at',
        'notes',
    ];

    protected $casts = [
        'statement_date' => 'date',
        'statement_balance' => 'decimal:2',
        'gl_balance' => 'decimal:2',
        'difference' => 'decimal:2',
        'completed_at' => 'datetime',
    ];

    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_COMPLETED = 'completed';

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function transactions(): HasMany
    {
        return $this->hasMany(BankTransaction::class, 'reconciliation_id');
    }

    /**
     * Complete the reconciliation
     */
    public function complete(): bool
    {
        if ($this->difference != 0) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_by' => auth()->id(),
            'completed_at' => now(),
        ]);

        // Update bank account
        $this->bankAccount->update([
            'last_reconciled_date' => $this->statement_date,
            'last_reconciled_balance' => $this->statement_balance,
        ]);

        return true;
    }
}
