<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * La description est validée comme `nullable` depuis le départ, mais la colonne était
     * NOT NULL : créer un compte ou une dépense sans description partait en erreur 500.
     * On aligne le schéma sur la validation.
     */
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->string('description')->nullable()->change();
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->string('description')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->string('description')->nullable(false)->change();
        });

        Schema::table('expenses', function (Blueprint $table) {
            $table->string('description')->nullable(false)->change();
        });
    }
};
