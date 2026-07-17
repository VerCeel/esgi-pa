<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * La vérification d'email devient obligatoire pour se connecter. Les comptes créés
     * avant cette règle n'ont jamais eu l'occasion de vérifier leur adresse : on les
     * considère vérifiés rétroactivement pour ne pas les bloquer au prochain login.
     * Seules les inscriptions postérieures à ce déploiement devront confirmer leur email.
     */
    public function up(): void
    {
        DB::table('users')
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);
    }

    public function down(): void
    {
        // Irréversible : on ne peut pas savoir quels comptes étaient réellement non vérifiés.
    }
};
