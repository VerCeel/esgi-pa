<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Un partage est d'abord une invitation envoyée à une adresse email — le destinataire
     * n'a pas forcément encore de compte Budgie. `user_id` n'est renseigné qu'à l'acceptation.
     */
    public function up(): void
    {
        Schema::create('account_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('account_id')->constrained('accounts')->cascadeOnDelete();
            $table->string('email');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('token', 64)->unique();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamps();

            // Une seule invitation en cours par compte et par adresse.
            $table->unique(['account_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('account_shares');
    }
};
