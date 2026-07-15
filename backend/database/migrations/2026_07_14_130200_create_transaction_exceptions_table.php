<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Une exception surcharge le montant d'une dépense OU d'un revenu sur une période,
     * sans toucher au montant initial : d'où la relation polymorphe.
     */
    public function up(): void
    {
        Schema::create('transaction_exceptions', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->decimal('amount', 10, 2);
            $table->enum('frequency_type', ['ONCE', 'RECURRING']);
            $table->integer('frequency_months')->nullable();
            $table->dateTime('start_date_time');
            $table->dateTime('end_date_time')->nullable();
            $table->morphs('exceptionable'); // Expense ou Income
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaction_exceptions');
    }
};
