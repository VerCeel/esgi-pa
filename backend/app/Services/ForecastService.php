<?php

namespace App\Services;

use App\Models\Account;
use App\Models\TransactionException;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Projette le solde des comptes à une date future.
 *
 * Le principe : on simule l'historique mois par mois, depuis la création du compte
 * jusqu'au mois demandé. Chaque mois on encaisse les revenus, on paie les dépenses,
 * puis on verse les intérêts sur le solde obtenu. Les intérêts sont donc composés,
 * comme sur un vrai livret — c'est ce que veut dire "primes d'intérêts versés
 * mensuellement" dans le sujet.
 */
class ForecastService
{
    /**
     * Garde-fou : au-delà de 100 ans de projection, on considère que la demande est
     * une erreur de saisie plutôt qu'un vrai besoin.
     */
    private const MAX_MONTHS = 1200;

    /**
     * Solde d'un compte à la fin du mois donné.
     *
     * @return array{balance: float, total_income: float, total_expense: float, total_interest: float}
     */
    public function accountBalance(Account $account, CarbonImmutable $targetMonth): array
    {
        $account->loadMissing(['expenses.exceptions', 'incomes.exceptions']);

        $target = $targetMonth->startOfMonth();
        $cursor = CarbonImmutable::parse($account->creation_date ?? $account->created_at)
            ->startOfMonth();

        $balance = 0.0;
        $totalIncome = 0.0;
        $totalExpense = 0.0;
        $totalInterest = 0.0;

        // Le taux est donné en annuel : on le ramène au mois pour l'appliquer à chaque pas.
        $monthlyRate = ((float) $account->remuneration_rate / 100) / 12;
        $taxRate = (float) $account->tax_rate / 100;

        $months = 0;

        while ($cursor <= $target && $months < self::MAX_MONTHS) {
            foreach ($account->incomes as $income) {
                $totalIncome += $this->amountForMonth($income, $cursor);
            }

            foreach ($account->expenses as $expense) {
                $totalExpense += $this->amountForMonth($expense, $cursor);
            }

            $balance = $totalIncome - $totalExpense + $totalInterest;

            // Pas d'intérêts sur un découvert : un solde négatif ne rapporte rien.
            if ($account->isInterestBearing() && $balance > 0) {
                $gross = $balance * $monthlyRate;
                $net = $gross * (1 - $taxRate);

                $totalInterest += $net;
                $balance += $net;
            }

            $cursor = $cursor->addMonth();
            $months++;
        }

        return [
            'balance' => round($balance, 2),
            'total_income' => round($totalIncome, 2),
            'total_expense' => round($totalExpense, 2),
            'total_interest' => round($totalInterest, 2),
        ];
    }

    /**
     * Prévision pour un ensemble de comptes, plus le total consolidé.
     *
     * @param  Collection<int, Account>  $accounts
     */
    public function forecast(Collection $accounts, CarbonImmutable $targetMonth): array
    {
        $lines = [];
        $total = 0.0;
        $totalInterest = 0.0;

        foreach ($accounts as $account) {
            $result = $this->accountBalance($account, $targetMonth);

            $lines[] = [
                'account_id' => $account->id,
                'account_name' => $account->name,
                'remuneration_rate' => (float) $account->remuneration_rate,
                'tax_rate' => (float) $account->tax_rate,
                ...$result,
            ];

            $total += $result['balance'];
            $totalInterest += $result['total_interest'];
        }

        return [
            'month' => $targetMonth->format('Y-m'),
            'as_of' => $targetMonth->endOfMonth()->toDateString(),
            'accounts' => $lines,
            'total_balance' => round($total, 2),
            'total_interest' => round($totalInterest, 2),
        ];
    }

    /**
     * Montant appliqué par une dépense ou un revenu sur un mois donné.
     * Rend 0 si la transaction ne tombe pas ce mois-là.
     *
     * Une exception qui couvre ce mois remplace le montant initial — sans jamais le modifier
     * en base, et sans toucher aux mois qu'elle ne couvre pas.
     */
    private function amountForMonth(Model $transaction, CarbonImmutable $month): float
    {
        if (! $this->occursIn(
            $transaction->start_date_time,
            $transaction->end_date_time,
            $transaction->frequency_type,
            $transaction->frequency_months,
            $month,
        )) {
            return 0.0;
        }

        $override = $this->exceptionForMonth($transaction, $month);

        return (float) ($override?->amount ?? $transaction->amount);
    }

    /**
     * La dernière exception créée l'emporte, si plusieurs couvrent le même mois.
     */
    private function exceptionForMonth(Model $transaction, CarbonImmutable $month): ?TransactionException
    {
        return $transaction->exceptions
            ->filter(fn (TransactionException $exception) => $this->occursIn(
                $exception->start_date_time,
                $exception->end_date_time,
                $exception->frequency_type,
                $exception->frequency_months,
                $month,
            ))
            ->sortByDesc('id')
            ->first();
    }

    /**
     * Est-ce que cette règle (ponctuelle ou "tous les N mois") tombe sur ce mois-ci ?
     */
    private function occursIn(
        mixed $startDate,
        mixed $endDate,
        string $frequencyType,
        ?int $frequencyMonths,
        CarbonImmutable $month,
    ): bool {
        $start = CarbonImmutable::parse($startDate)->startOfMonth();

        if ($month < $start) {
            return false;
        }

        if ($endDate && $month > CarbonImmutable::parse($endDate)->startOfMonth()) {
            return false;
        }

        if ($frequencyType === 'ONCE') {
            return $month->equalTo($start);
        }

        // "Tous les N mois" : on compte à partir du mois de départ.
        $step = max(1, (int) $frequencyMonths);

        return $start->diffInMonths($month) % $step === 0;
    }
}
