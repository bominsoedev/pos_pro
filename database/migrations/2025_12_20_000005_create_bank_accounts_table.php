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
        Schema::create('bank_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->nullable()->constrained('accounts'); // Linked GL account
            $table->string('name'); // Display name for the account
            $table->string('bank_name');
            $table->string('account_number');
            $table->string('account_type')->default('checking'); // checking, savings, credit_card
            $table->string('currency', 10)->default('MMK');
            $table->string('branch')->nullable();
            $table->string('swift_code')->nullable();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->decimal('current_balance', 15, 2)->default(0);
            $table->timestamp('last_reconciled_at')->nullable();
            $table->decimal('last_reconciled_balance', 15, 2)->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_accounts');
    }
};
