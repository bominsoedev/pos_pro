<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FiscalYear extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'is_closed',
        'is_current',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_closed' => 'boolean',
        'is_current' => 'boolean',
    ];

    public function journalEntries(): HasMany
    {
        return $this->hasMany(JournalEntry::class);
    }

    public static function getCurrent(): ?self
    {
        return self::where('is_current', true)->first();
    }

    public static function findByDate($date): ?self
    {
        return self::where('start_date', '<=', $date)
            ->where('end_date', '>=', $date)
            ->first();
    }

    public function close(): void
    {
        $this->update(['is_closed' => true, 'is_current' => false]);
    }
}
