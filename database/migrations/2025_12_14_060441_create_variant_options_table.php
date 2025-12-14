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
        Schema::create('variant_options', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('name'); // e.g., "Size", "Color", "Weight"
            $table->string('value'); // e.g., "Small", "Red", "500g"
            $table->integer('display_order')->default(0);
            $table->timestamps();
        });

        Schema::create('product_variant_option', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('variant_option_id')->constrained()->cascadeOnDelete();
            $table->timestamps();
            
            $table->unique(['product_variant_id', 'variant_option_id'], 'pvo_variant_option_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_variant_option');
        Schema::dropIfExists('variant_options');
    }
};
