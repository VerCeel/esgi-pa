<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Builder;

trait FiltersTransactions
{
    /**
     * Filtre une liste de dépenses ou de revenus par nom court ou description.
     *
     * On compare en minuscules des deux côtés plutôt que d'utiliser LIKE tel quel :
     * sous PostgreSQL, LIKE est sensible à la casse (contrairement à MySQL et SQLite),
     * et chercher "triumph" ne trouverait pas "Triumph".
     */
    protected function applySearch(Builder $query, ?string $search): Builder
    {
        $search = trim((string) $search);

        if ($search === '') {
            return $query;
        }

        // Les jokers saisis par l'utilisateur sont échappés : sans ça, un simple "%"
        // ferait remonter toute la table.
        $term = '%' . mb_strtolower(addcslashes($search, '%_\\')) . '%';

        return $query->where(function (Builder $filtered) use ($term) {
            $filtered->whereRaw('LOWER(name) LIKE ?', [$term])
                ->orWhereRaw('LOWER(COALESCE(description, \'\')) LIKE ?', [$term]);
        });
    }
}
