<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'description', 'creation_date', 'remuneration_rate', 'tax_rate', 'user_id'])]
class Account extends Model
{
    /** @use HasFactory<\Database\Factories\AccountFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'creation_date' => 'date',
            'remuneration_rate' => 'decimal:2',
            'tax_rate' => 'decimal:2',
        ];
    }

    /**
     * Toutes les FK ne suppriment pas en cascade (les dépenses n'ont pas de
     * ON DELETE CASCADE) et les exceptions sont polymorphes, donc sans contrainte :
     * un compte qui porte des dépenses ne pouvait pas être supprimé. On nettoie donc
     * explicitement toute sa descendance juste avant de supprimer le compte lui-même.
     */
    protected static function booted(): void
    {
        static::deleting(function (Account $account): void {
            $account->loadMissing(['expenses:id,account_id', 'incomes:id,account_id']);

            TransactionException::where('exceptionable_type', Expense::class)
                ->whereIn('exceptionable_id', $account->expenses->pluck('id'))
                ->delete();

            TransactionException::where('exceptionable_type', Income::class)
                ->whereIn('exceptionable_id', $account->incomes->pluck('id'))
                ->delete();

            $account->expenses()->delete();
            $account->incomes()->delete();
            $account->shares()->delete();
        });
    }

    /** Le propriétaire du compte, le seul à pouvoir le modifier. */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function incomes(): HasMany
    {
        return $this->hasMany(Income::class);
    }

    public function shares(): HasMany
    {
        return $this->hasMany(AccountShare::class);
    }

    /** Les utilisateurs à qui ce compte a été partagé, en lecture seule. */
    public function sharedWithUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'account_shares')
            ->whereNotNull('account_shares.accepted_at');
    }

    /** Un compte est rémunéré dès qu'il porte un taux strictement positif. */
    public function isInterestBearing(): bool
    {
        return (float) $this->remuneration_rate > 0;
    }
}
