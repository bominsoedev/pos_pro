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
        Schema::create('bank_reconciliations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('bank_account_id')->constrained('bank_accounts');
            $table->date('statement_date');
            $table->decimal('statement_balance', 15, 2);
            $table->decimal('gl_balance', 15, 2);
            $table->decimal('difference', 15, 2)->default(0);
            $table->enum('status', ['in_progress', 'completed'])->default('in_progress');
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['bank_account_id', 'statement_date']);
        });

        // Add foreign key to bank_transactions
        Schema::table('bank_transactions', function (Blueprint $table) {
            $table->foreign('reconciliation_id')->references('id')->on('bank_reconciliations')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bank_transactions', function (Blueprint $table) {
            $table->dropForeign(['reconciliation_id']);
        });
        Schema::dropIfExists('bank_reconciliations');
    }
};
