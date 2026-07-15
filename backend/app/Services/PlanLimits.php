<?php

namespace App\Services;

use App\Models\Account;
use App\Models\User;

/**
 * Limites du plan gratuit (le plan payant est illimité).
 *
 * Elles sont vérifiées côté serveur au moment de la création : le front peut bien
 * cacher un bouton, ça n'empêche personne d'appeler l'API directement.
 */
class PlanLimits
{
    public const FREE_MAX_ACCOUNTS = 2;

    public const FREE_MAX_EXPENSES_PER_ACCOUNT = 7;

    public const FREE_MAX_INCOMES_PER_ACCOUNT = 2;

    public function canCreateAccount(User $user): bool
    {
        return $user->isPremium()
            || $user->accounts()->count() < self::FREE_MAX_ACCOUNTS;
    }

    public function canCreateExpense(User $user, Account $account): bool
    {
        return $user->isPremium()
            || $account->expenses()->count() < self::FREE_MAX_EXPENSES_PER_ACCOUNT;
    }

    public function canCreateIncome(User $user, Account $account): bool
    {
        return $user->isPremium()
            || $account->incomes()->count() < self::FREE_MAX_INCOMES_PER_ACCOUNT;
    }

    /** Ce que l'utilisateur a le droit de faire, tel que le front peut l'afficher. */
    public function summary(User $user): array
    {
        $isPremium = $user->isPremium();

        return [
            'plan' => $isPremium ? 'PREMIUM' : 'FREE',
            'plan_ends_at' => $user->plan_ends_at,
            'limits' => [
                'accounts' => $isPremium ? null : self::FREE_MAX_ACCOUNTS,
                'expenses_per_account' => $isPremium ? null : self::FREE_MAX_EXPENSES_PER_ACCOUNT,
                'incomes_per_account' => $isPremium ? null : self::FREE_MAX_INCOMES_PER_ACCOUNT,
            ],
            'usage' => [
                'accounts' => $user->accounts()->count(),
            ],
        ];
    }
}
