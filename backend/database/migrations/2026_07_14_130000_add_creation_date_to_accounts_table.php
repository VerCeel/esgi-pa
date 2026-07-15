<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Le sujet demande une "date de création" du compte, distincte de la date
     * d'enregistrement en base : un Livret A ouvert en 2010 peut être saisi aujourd'hui.
     * C'est cette date qui sert de point de départ aux prévisions.
     */
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->date('creation_date')->nullable()->after('description');
        });

        // Les comptes déjà en base prennent leur date d'enregistrement comme date de création.
        DB::table('accounts')->whereNull('creation_date')->update([
            'creation_date' => DB::raw('date(created_at)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('creation_date');
        });
    }
};
