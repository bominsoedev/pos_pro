<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RecurringJournalEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'frequency',
        'day_of_week',
        'day_of_month',
        'month_of_year',
        'start_date',
        'end_date',
        'next_run_date',
        'last_run_date',
        'total_amount',
        'occurrences',
        'max_occurrences',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'next_run_date' => 'date',
        'last_run_date' => 'date',
        'total_amount' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    const FREQUENCY_DAILY = 'daily';
    const FREQUENCY_WEEKLY = 'weekly';
    const FREQUENCY_MONTHLY = 'monthly';
    const FREQUENCY_QUARTERLY = 'quarterly';
    const FREQUENCY_YEARLY = 'yearly';

    public function lines(): HasMany
    {
        return $this->hasMany(RecurringJournalEntryLine::class)->orderBy('line_order');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function generatedEntries(): HasMany
    {
        return $this->hasMany(JournalEntry::class, 'source_id')
            ->where('source_type', self::class);
    }

    /**
     * Check if entry should run today
     */
    public function shouldRunToday(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->end_date && Carbon::today()->gt($this->end_date)) {
            return false;
        }

        if ($this->max_occurrences && $this->occurrences >= $this->max_occurrences) {
            return false;
        }

        return Carbon::today()->gte($this->next_run_date);
    }

    /**
     * Calculate next run date based on frequency
     */
    public function calculateNextRunDate(): Carbon
    {
        $current = $this->next_run_date ?? Carbon::today();

        return match ($this->frequency) {
            self::FREQUENCY_DAILY => $current->copy()->addDay(),
            self::FREQUENCY_WEEKLY => $current->copy()->addWeek(),
            self::FREQUENCY_MONTHLY => $current->copy()->addMonth(),
            self::FREQUENCY_QUARTERLY => $current->copy()->addMonths(3),
            self::FREQUENCY_YEARLY => $current->copy()->addYear(),
            default => $current->copy()->addMonth(),
        };
    }

    /**
     * Generate a journal entry from this recurring template
     */
    public function generateJournalEntry(): ?JournalEntry
    {
        if (!$this->shouldRunToday()) {
            return null;
        }

        $entry = JournalEntry::create([
            'entry_number' => JournalEntry::generateEntryNumber(),
            'entry_date' => Carbon::today(),
            'reference' => 'REC-' . $this->id,
            'description' => $this->description ?? $this->name,
            'source' => 'recurring',
            'source_type' => self::class,
            'source_id' => $this->id,
            'total_debit' => $this->total_amount,
            'total_credit' => $this->total_amount,
            'created_by' => $this->created_by,
            'status' => 'posted',
            'posted_by' => $this->created_by,
            'posted_at' => now(),
        ]);

        foreach ($this->lines as $line) {
            $entry->lines()->create([
                'account_id' => $line->account_id,
                'description' => $line->description,
                'debit' => $line->debit,
                'credit' => $line->credit,
                'line_order' => $line->line_order,
            ]);
        }

        // Update recurring entry
        $this->update([
            'last_run_date' => Carbon::today(),
            'next_run_date' => $this->calculateNextRunDate(),
            'occurrences' => $this->occurrences + 1,
        ]);

        return $entry;
    }

    /**
     * Get frequency display name
     */
    public function getFrequencyDisplayAttribute(): string
    {
        return match ($this->frequency) {
            self::FREQUENCY_DAILY => 'Daily',
            self::FREQUENCY_WEEKLY => 'Weekly',
            self::FREQUENCY_MONTHLY => 'Monthly',
            self::FREQUENCY_QUARTERLY => 'Quarterly',
            self::FREQUENCY_YEARLY => 'Yearly',
            default => $this->frequency,
        };
    }
}
