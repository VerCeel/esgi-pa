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
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->enum('frequency_type', ['ONCE', 'RECURRING']);
            $table->integer('frequency_months')->nullable();
            $table->dateTime('start_date_time')->nullable()->format('Y-m-d H:i:s');
            $table->dateTime('end_date_time')->nullable()->format('Y-m-d H:i:s');
            $table->foreignId('account_id')->constrained('accounts');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
