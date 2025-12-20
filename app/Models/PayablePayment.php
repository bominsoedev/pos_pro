<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayablePayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'payable_id',
        'payment_number',
        'payment_date',
        'amount',
        'payment_method',
        'reference',
        'notes',
        'bank_account_id',
        'journal_entry_id',
        'created_by',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function payable(): BelongsTo
    {
        return $this->belongsTo(Payable::class);
    }

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function journalEntry(): BelongsTo
    {
        return $this->belongsTo(JournalEntry::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Generate payment number
     */
    public static function generatePaymentNumber(): string
    {
        $year = date('Y');
        $lastPayment = self::whereYear('created_at', $year)->latest('id')->first();
        $number = $lastPayment ? (int) substr($lastPayment->payment_number, -6) + 1 : 1;
        return 'PAY-' . $year . '-' . str_pad($number, 6, '0', STR_PAD_LEFT);
    }

    protected static function booted(): void
    {
        static::created(function ($payment) {
            $payment->payable->updatePaymentStatus();
        });

        static::deleted(function ($payment) {
            $payment->payable->updatePaymentStatus();
        });
    }
}
