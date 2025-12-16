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
        Schema::table('customers', function (Blueprint $table) {
            $table->decimal('credit_balance', 10, 2)->default(0)->after('loyalty_tier');
            $table->decimal('credit_limit', 10, 2)->default(0)->after('credit_balance');
            $table->boolean('allow_credit')->default(false)->after('credit_limit');
            $table->integer('payment_terms_days')->default(0)->after('allow_credit');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['credit_balance', 'credit_limit', 'allow_credit', 'payment_terms_days']);
        });
    }
};
