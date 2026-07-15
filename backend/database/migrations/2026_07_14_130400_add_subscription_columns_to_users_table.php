<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('plan', ['FREE', 'PREMIUM'])->default('FREE')->after('email');
            $table->string('stripe_customer_id')->nullable()->after('plan');
            $table->string('stripe_subscription_id')->nullable()->after('stripe_customer_id');
            // Fin de la période payée : le plan reste PREMIUM jusque-là même après résiliation.
            $table->timestamp('plan_ends_at')->nullable()->after('stripe_subscription_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'plan',
                'stripe_customer_id',
                'stripe_subscription_id',
                'plan_ends_at',
            ]);
        });
    }
};
