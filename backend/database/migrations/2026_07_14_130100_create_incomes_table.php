<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Un revenu a exactement la même forme qu'une dépense : seul le signe change
     * au moment du calcul des prévisions.
     */
    public function up(): void
    {
        Schema::create('incomes', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->decimal('amount', 10, 2);
            $table->enum('frequency_type', ['ONCE', 'RECURRING']);
            $table->integer('frequency_months')->nullable();
            $table->dateTime('start_date_time');
            $table->dateTime('end_date_time')->nullable();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incomes');
    }
};
