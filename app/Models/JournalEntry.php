<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class JournalEntry extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'entry_number',
        'entry_date',
        'fiscal_year_id',
        'reference',
        'description',
        'status',
        'source',
        'source_type',
        'source_id',
        'total_debit',
        'total_credit',
        'created_by',
        'posted_by',
        'posted_at',
        'voided_by',
        'voided_at',
        'void_reason',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'total_debit' => 'decimal:2',
        'total_credit' => 'decimal:2',
        'posted_at' => 'datetime',
        'voided_at' => 'datetime',
    ];

    // Status constants
    const STATUS_DRAFT = 'draft';
    const STATUS_POSTED = 'posted';
    const STATUS_VOID = 'void';

    // Source constants
    const SOURCE_MANUAL = 'manual';
    const SOURCE_SALES = 'sales';
    const SOURCE_EXPENSE = 'expense';
    const SOURCE_PURCHASE = 'purchase';
    const SOURCE_REFUND = 'refund';
    const SOURCE_PAYMENT = 'payment';
    const SOURCE_ADJUSTMENT = 'adjustment';

    public function fiscalYear(): BelongsTo
    {
        return $this->belongsTo(FiscalYear::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class)->orderBy('line_order');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function postedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function voidedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    /**
     * Get the source model
     */
    public function source(): MorphTo
    {
        return $this->morphTo('source', 'source_type', 'source_id');
    }

    /**
     * Generate entry number
     */
    public static function generateEntryNumber(): string
    {
        $year = date('Y');
        $lastEntry = self::whereYear('created_at', $year)->latest('id')->first();
        $number = $lastEntry ? (int) substr($lastEntry->entry_number, -6) + 1 : 1;
        return 'JE-' . $year . '-' . str_pad($number, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Check if entry is balanced
     */
    public function isBalanced(): bool
    {
        return bccomp($this->total_debit, $this->total_credit, 2) === 0;
    }

    /**
     * Recalculate totals
     */
    public function recalculateTotals(): void
    {
        $this->total_debit = $this->lines()->sum('debit');
        $this->total_credit = $this->lines()->sum('credit');
        $this->save();
    }

    /**
     * Post the journal entry
     */
    public function post($userId = null): bool
    {
        if (!$this->isBalanced()) {
            return false;
        }

        if ($this->status !== self::STATUS_DRAFT) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_POSTED,
            'posted_by' => $userId ?? auth()->id(),
            'posted_at' => now(),
        ]);

        return true;
    }

    /**
     * Void the journal entry
     */
    public function void(string $reason, $userId = null): bool
    {
        if ($this->status !== self::STATUS_POSTED) {
            return false;
        }

        $this->update([
            'status' => self::STATUS_VOID,
            'voided_by' => $userId ?? auth()->id(),
            'voided_at' => now(),
            'void_reason' => $reason,
        ]);

        return true;
    }

    /**
     * Create a reversing entry
     */
    public function createReversingEntry(string $description = null): self
    {
        $reversal = self::create([
            'entry_number' => self::generateEntryNumber(),
            'entry_date' => now(),
            'fiscal_year_id' => $this->fiscal_year_id,
            'reference' => 'REV-' . $this->entry_number,
            'description' => $description ?? 'Reversal of ' . $this->entry_number,
            'source' => self::SOURCE_ADJUSTMENT,
            'source_type' => get_class($this),
            'source_id' => $this->id,
            'created_by' => auth()->id(),
        ]);

        foreach ($this->lines as $line) {
            $reversal->lines()->create([
                'account_id' => $line->account_id,
                'description' => 'Reversal: ' . $line->description,
                'debit' => $line->credit,
                'credit' => $line->debit,
                'line_order' => $line->line_order,
            ]);
        }

        $reversal->recalculateTotals();

        return $reversal;
    }
}
