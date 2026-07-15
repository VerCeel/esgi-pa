<?php

namespace App\Http\Controllers\Concerns;

use App\Models\Account;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Deux niveaux d'accès à un compte, et il ne faut jamais les confondre :
 * - propriétaire : lecture ET écriture ;
 * - invité (partage) : lecture seule, sur le compte comme sur ses dépenses et revenus.
 */
trait ResolvesAccounts
{
    /** Le compte, seulement si l'utilisateur en est le propriétaire. */
    protected function ownedAccount(User $user, int $accountId): ?Account
    {
        return $user->accounts()->whereKey($accountId)->first();
    }

    /** Le compte, qu'il soit possédé ou simplement partagé en lecture. */
    protected function readableAccount(User $user, int $accountId): ?Account
    {
        return $this->ownedAccount($user, $accountId)
            ?? $user->sharedAccounts()->whereKey($accountId)->first();
    }

    /**
     * Les identifiants de tous les comptes que l'utilisateur peut lire.
     *
     * @return array<int>
     */
    protected function readableAccountIds(User $user): array
    {
        return [
            ...$user->accounts()->pluck('accounts.id')->all(),
            ...$user->sharedAccounts()->pluck('accounts.id')->all(),
        ];
    }

    /**
     * Restreint une requête sur les dépenses/revenus aux comptes possédés par l'utilisateur.
     * Les comptes partagés sont volontairement exclus : ils sont en lecture seule.
     */
    protected function scopeToOwnedAccounts(Builder $query, User $user): Builder
    {
        return $query->whereHas('account', fn (Builder $account) => $account->where('user_id', $user->id));
    }
}
