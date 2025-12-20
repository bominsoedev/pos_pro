<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('recurring_journal_entries', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']);
            $table->unsignedTinyInteger('day_of_week')->nullable(); // 0-6 for weekly
            $table->unsignedTinyInteger('day_of_month')->nullable(); // 1-31 for monthly
            $table->unsignedTinyInteger('month_of_year')->nullable(); // 1-12 for yearly
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->date('next_run_date');
            $table->date('last_run_date')->nullable();
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->unsignedInteger('occurrences')->default(0); // Count of times run
            $table->unsignedInteger('max_occurrences')->nullable(); // Limit occurrences
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('recurring_journal_entry_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('recurring_journal_entry_id')->constrained()->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('accounts');
            $table->string('description')->nullable();
            $table->decimal('debit', 15, 2)->default(0);
            $table->decimal('credit', 15, 2)->default(0);
            $table->unsignedInteger('line_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recurring_journal_entry_lines');
        Schema::dropIfExists('recurring_journal_entries');
    }
};
