<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Account extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'name_mm',
        'description',
        'type',
        'subtype',
        'parent_id',
        'opening_balance',
        'opening_balance_date',
        'is_system',
        'is_active',
        'level',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'opening_balance_date' => 'date',
        'is_system' => 'boolean',
        'is_active' => 'boolean',
        'level' => 'integer',
    ];

    // Account types
    const TYPE_ASSET = 'asset';
    const TYPE_LIABILITY = 'liability';
    const TYPE_EQUITY = 'equity';
    const TYPE_INCOME = 'income';
    const TYPE_EXPENSE = 'expense';

    // Subtypes
    const SUBTYPES = [
        'asset' => ['cash', 'bank', 'accounts_receivable', 'inventory', 'prepaid', 'fixed_asset', 'other_asset'],
        'liability' => ['accounts_payable', 'credit_card', 'current_liability', 'long_term_liability', 'other_liability'],
        'equity' => ['owners_equity', 'retained_earnings', 'other_equity'],
        'income' => ['sales', 'other_income'],
        'expense' => ['cost_of_goods_sold', 'operating_expense', 'payroll', 'other_expense'],
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Account::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Account::class, 'parent_id');
    }

    public function journalEntryLines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class);
    }

    public function bankAccount(): HasMany
    {
        return $this->hasMany(BankAccount::class);
    }

    /**
     * Get account balance at a specific date
     */
    public function getBalanceAttribute(): float
    {
        return $this->getBalanceAsOf(now());
    }

    public function getBalanceAsOf($date): float
    {
        $lines = $this->journalEntryLines()
            ->whereHas('journalEntry', function ($query) use ($date) {
                $query->where('status', 'posted')
                    ->where('entry_date', '<=', $date);
            })
            ->get();

        $debits = $lines->sum('debit');
        $credits = $lines->sum('credit');

        // For Assets and Expenses, debit increases balance
        // For Liabilities, Equity, and Income, credit increases balance
        if (in_array($this->type, [self::TYPE_ASSET, self::TYPE_EXPENSE])) {
            return $this->opening_balance + $debits - $credits;
        }

        return $this->opening_balance + $credits - $debits;
    }

    /**
     * Get debit balance
     */
    public function getDebitBalance($startDate = null, $endDate = null): float
    {
        $query = $this->journalEntryLines()
            ->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'posted');
                if ($startDate) {
                    $q->where('entry_date', '>=', $startDate);
                }
                if ($endDate) {
                    $q->where('entry_date', '<=', $endDate);
                }
            });

        return $query->sum('debit');
    }

    /**
     * Get credit balance
     */
    public function getCreditBalance($startDate = null, $endDate = null): float
    {
        $query = $this->journalEntryLines()
            ->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                $q->where('status', 'posted');
                if ($startDate) {
                    $q->where('entry_date', '>=', $startDate);
                }
                if ($endDate) {
                    $q->where('entry_date', '<=', $endDate);
                }
            });

        return $query->sum('credit');
    }

    /**
     * Check if account is a debit account type
     */
    public function isDebitAccount(): bool
    {
        return in_array($this->type, [self::TYPE_ASSET, self::TYPE_EXPENSE]);
    }

    /**
     * Get accounts by type
     */
    public static function getByType(string $type)
    {
        return self::where('type', $type)->where('is_active', true)->orderBy('code')->get();
    }

    /**
     * Get hierarchical accounts
     */
    public static function getHierarchical()
    {
        return self::with('children')
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('code')
            ->get();
    }

    /**
     * Get display name with code
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->code . ' - ' . $this->name;
    }
}
