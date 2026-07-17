<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Connexion sociale : un utilisateur qui s'inscrit via Google/Apple n'a pas de mot de
     * passe, d'où le `password` désormais nullable. `provider` + `provider_id` identifient
     * le compte chez le fournisseur (l'unicité empêche deux comptes liés au même identifiant).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('password')->nullable()->change();
            $table->string('provider')->nullable()->after('password');
            $table->string('provider_id')->nullable()->after('provider');

            $table->unique(['provider', 'provider_id']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['provider', 'provider_id']);
            $table->dropColumn(['provider', 'provider_id']);
            $table->string('password')->nullable(false)->change();
        });
    }
};
