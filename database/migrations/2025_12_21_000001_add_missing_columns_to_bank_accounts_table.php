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
        Schema::table('bank_accounts', function (Blueprint $table) {
            // Add missing columns if they don't exist
            if (!Schema::hasColumn('bank_accounts', 'name')) {
                // Use account_name as name alias or add new column
                $table->string('name')->nullable()->after('account_id');
            }
            if (!Schema::hasColumn('bank_accounts', 'account_type')) {
                $table->string('account_type')->default('checking')->after('account_number');
            }
            if (!Schema::hasColumn('bank_accounts', 'currency')) {
                $table->string('currency', 10)->default('MMK')->after('account_type');
            }
            if (!Schema::hasColumn('bank_accounts', 'opening_balance')) {
                $table->decimal('opening_balance', 15, 2)->default(0)->after('currency');
            }
            if (!Schema::hasColumn('bank_accounts', 'description')) {
                $table->text('description')->nullable()->after('is_active');
            }
            if (!Schema::hasColumn('bank_accounts', 'last_reconciled_at') && Schema::hasColumn('bank_accounts', 'last_reconciled_date')) {
                // Rename last_reconciled_date to last_reconciled_at
                $table->renameColumn('last_reconciled_date', 'last_reconciled_at');
            }
        });

        // Copy account_name to name if name is empty
        if (Schema::hasColumn('bank_accounts', 'account_name') && Schema::hasColumn('bank_accounts', 'name')) {
            \DB::statement('UPDATE bank_accounts SET name = account_name WHERE name IS NULL OR name = ""');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bank_accounts', function (Blueprint $table) {
            if (Schema::hasColumn('bank_accounts', 'name')) {
                $table->dropColumn('name');
            }
            if (Schema::hasColumn('bank_accounts', 'account_type')) {
                $table->dropColumn('account_type');
            }
            if (Schema::hasColumn('bank_accounts', 'currency')) {
                $table->dropColumn('currency');
            }
            if (Schema::hasColumn('bank_accounts', 'opening_balance')) {
                $table->dropColumn('opening_balance');
            }
            if (Schema::hasColumn('bank_accounts', 'description')) {
                $table->dropColumn('description');
            }
            if (Schema::hasColumn('bank_accounts', 'last_reconciled_at')) {
                $table->renameColumn('last_reconciled_at', 'last_reconciled_date');
            }
        });
    }
};
