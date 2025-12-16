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
        Schema::create('gift_cards', function (Blueprint $table) {
            $table->id();
            $table->string('card_number')->unique();
            $table->string('pin_code')->nullable();
            $table->decimal('initial_amount', 10, 2);
            $table->decimal('current_balance', 10, 2);
            $table->foreignId('customer_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('status', ['active', 'used', 'expired', 'cancelled'])->default('active');
            $table->date('expires_at')->nullable();
            $table->foreignId('purchased_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('set null');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('card_number');
            $table->index('status');
            $table->index('expires_at');
        });

        Schema::create('gift_card_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gift_card_id')->constrained()->onDelete('cascade');
            $table->enum('type', ['purchase', 'redemption', 'refund', 'expiration'])->default('purchase');
            $table->decimal('amount', 10, 2);
            $table->decimal('balance_after', 10, 2);
            $table->foreignId('order_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->index('gift_card_id');
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gift_card_transactions');
        Schema::dropIfExists('gift_cards');
    }
};
