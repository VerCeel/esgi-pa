<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['account_id', 'email', 'user_id', 'token', 'accepted_at'])]
#[Hidden(['token'])]
class AccountShare extends Model
{
    /** @use HasFactory<\Database\Factories\AccountShareFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
        ];
    }

    public function account(): BelongsTo
    {
        return $this->belongsTo(Account::class);
    }

    /** L'invité, une fois qu'il a accepté (null tant que l'invitation est en attente). */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
