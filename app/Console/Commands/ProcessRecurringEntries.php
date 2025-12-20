<?php

namespace App\Console\Commands;

use App\Models\RecurringJournalEntry;
use Illuminate\Console\Command;

class ProcessRecurringEntries extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'accounting:process-recurring 
                            {--dry-run : Show what would be processed without actually creating entries}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process recurring journal entries that are due today';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if (!feature_enabled('accounting')) {
            $this->warn('Accounting feature is not enabled.');
            return self::SUCCESS;
        }

        $dryRun = $this->option('dry-run');

        $this->info('Processing recurring journal entries...');

        $dueEntries = RecurringJournalEntry::where('is_active', true)
            ->where('next_run_date', '<=', now()->toDateString())
            ->where(function ($query) {
                $query->whereNull('end_date')
                    ->orWhere('end_date', '>=', now()->toDateString());
            })
            ->where(function ($query) {
                $query->whereNull('max_occurrences')
                    ->orWhereRaw('occurrences < max_occurrences');
            })
            ->get();

        if ($dueEntries->isEmpty()) {
            $this->info('No recurring entries due for processing.');
            return self::SUCCESS;
        }

        $this->info("Found {$dueEntries->count()} recurring entries to process.");

        $processed = 0;
        $failed = 0;

        foreach ($dueEntries as $recurringEntry) {
            $this->line("Processing: {$recurringEntry->name}");

            if ($dryRun) {
                $this->info("  [DRY RUN] Would create entry for {$recurringEntry->name} - Amount: {$recurringEntry->total_amount}");
                continue;
            }

            try {
                $journalEntry = $recurringEntry->generateJournalEntry();

                if ($journalEntry) {
                    $this->info("  Created: {$journalEntry->entry_number}");
                    $processed++;
                } else {
                    $this->warn("  Skipped: Entry conditions not met");
                }
            } catch (\Exception $e) {
                $this->error("  Failed: {$e->getMessage()}");
                \Log::error("Failed to process recurring entry {$recurringEntry->id}: {$e->getMessage()}");
                $failed++;
            }
        }

        if (!$dryRun) {
            $this->newLine();
            $this->info("Summary: {$processed} entries created, {$failed} failed.");
        }

        return self::SUCCESS;
    }
}
