<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RecurringJournalEntryLine extends Model
{
    use HasFactory;

    protected $fillable = [
        'recurring_journal_entry_id',
        'account_id',
        'description',
        'debit',
        'credit',
        'line_order',
    ];

    protected $casts = [
        'debit' => 'decimal:2',
        'credit' => 'decimal:2',
    ];

    public function recurringJournalEntry(): BelongsTo
    {
        return $this->belongsTo(RecurringJournalEntry::class);
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }
}
