<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE inventory_logs MODIFY COLUMN type ENUM('sale', 'purchase', 'adjustment', 'return', 'damage') DEFAULT 'adjustment'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE inventory_logs MODIFY COLUMN type ENUM('sale', 'purchase', 'adjustment', 'return') DEFAULT 'adjustment'");
    }
};
