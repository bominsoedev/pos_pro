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
        Schema::create('bank_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_account_id')->constrained('bank_accounts')->cascadeOnDelete();
            $table->date('transaction_date');
            $table->string('reference')->nullable();
            $table->text('description');
            $table->decimal('amount', 15, 2); // Positive for deposits, negative for withdrawals
            $table->decimal('balance', 15, 2)->nullable(); // Running balance from statement
            $table->enum('type', ['deposit', 'withdrawal', 'transfer', 'fee', 'interest', 'other']);
            $table->enum('status', ['pending', 'matched', 'reconciled'])->default('pending');
            $table->foreignId('journal_entry_id')->nullable()->constrained('journal_entries')->nullOnDelete();
            $table->foreignId('reconciliation_id')->nullable(); // Will be linked later
            $table->boolean('is_imported')->default(false);
            $table->timestamps();

            $table->index(['bank_account_id', 'transaction_date']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_transactions');
    }
};
