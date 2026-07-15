<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

/**
 * Surcharge le montant d'une dépense ou d'un revenu sur une période donnée.
 * Le montant initial de la transaction n'est jamais modifié : l'exception ne
 * s'applique qu'au moment du calcul des prévisions, mois par mois.
 */
#[Fillable(['name', 'description', 'amount', 'frequency_type', 'frequency_months', 'start_date_time', 'end_date_time'])]
class TransactionException extends Model
{
    /** @use HasFactory<\Database\Factories\TransactionExceptionFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'start_date_time' => 'datetime',
            'end_date_time' => 'datetime',
        ];
    }

    /** @return MorphTo<Expense|Income, $this> */
    public function exceptionable(): MorphTo
    {
        return $this->morphTo();
    }
}
