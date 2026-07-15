<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Account;

#[Fillable(['name', 'email', 'password', 'avatar'])]
#[Hidden(['password', 'remember_token', 'two_factor_secret', 'two_factor_recovery_codes', 'stripe_customer_id', 'stripe_subscription_id'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $appends = ['avatar_url', 'two_factor_enabled'];

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar ? '/storage/' . $this->avatar : null;
    }

    public function getTwoFactorEnabledAttribute(): bool
    {
        return $this->hasTwoFactorEnabled();
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted:array',
            'two_factor_confirmed_at' => 'datetime',
            'plan_ends_at' => 'datetime',
        ];
    }

    /** Les comptes dont l'utilisateur est propriétaire (lecture ET écriture). */
    public function accounts()
    {
        return $this->hasMany(Account::class);
    }

    /** Les comptes qu'on lui a partagés (lecture seule). */
    public function sharedAccounts(): BelongsToMany
    {
        return $this->belongsToMany(Account::class, 'account_shares')
            ->whereNotNull('account_shares.accepted_at');
    }

    /**
     * Le 2FA n'est actif que si l'utilisateur a confirmé son secret avec un code valide.
     */
    public function hasTwoFactorEnabled(): bool
    {
        return ! is_null($this->two_factor_secret) && ! is_null($this->two_factor_confirmed_at);
    }

    /**
     * Premium tant que la période payée n'est pas écoulée : une résiliation en cours de
     * mois ne doit pas couper l'accès immédiatement.
     */
    public function isPremium(): bool
    {
        if ($this->plan !== 'PREMIUM') {
            return false;
        }

        return is_null($this->plan_ends_at) || $this->plan_ends_at->isFuture();
    }
}
