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
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique(); // Account code e.g., "1000"
            $table->string('name');
            $table->string('name_mm')->nullable(); // Myanmar name
            $table->text('description')->nullable();
            $table->enum('type', ['asset', 'liability', 'equity', 'income', 'expense']);
            $table->enum('subtype', [
                // Assets
                'cash', 'bank', 'accounts_receivable', 'inventory', 'prepaid', 'fixed_asset', 'other_asset',
                // Liabilities
                'accounts_payable', 'credit_card', 'current_liability', 'long_term_liability', 'other_liability',
                // Equity
                'owners_equity', 'retained_earnings', 'other_equity',
                // Income
                'sales', 'other_income',
                // Expenses
                'cost_of_goods_sold', 'operating_expense', 'payroll', 'other_expense'
            ]);
            $table->foreignId('parent_id')->nullable()->constrained('accounts')->nullOnDelete();
            $table->decimal('opening_balance', 15, 2)->default(0);
            $table->date('opening_balance_date')->nullable();
            $table->boolean('is_system')->default(false); // System accounts cannot be deleted
            $table->boolean('is_active')->default(true);
            $table->integer('level')->default(0); // Hierarchy level
            $table->timestamps();
            $table->softDeletes();

            $table->index(['type', 'subtype']);
            $table->index('parent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};
