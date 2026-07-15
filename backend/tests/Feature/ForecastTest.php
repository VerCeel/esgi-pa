<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Expense;
use App\Models\Income;
use App\Models\User;
use App\Services\ForecastService;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ForecastTest extends TestCase
{
    use RefreshDatabase;

    private function makeAccount(array $attributes = []): Account
    {
        $user = User::create([
            'name' => 'Test',
            'email' => 'forecast' . uniqid() . '@example.com',
            'password' => 'password123',
        ]);

        return Account::create([
            'name' => 'Compte courant',
            'description' => 'Test',
            'creation_date' => '2025-01-01',
            'remuneration_rate' => 0,
            'tax_rate' => 0,
            'user_id' => $user->id,
            ...$attributes,
        ]);
    }

    private function forecast(Account $account, string $month): array
    {
        return app(ForecastService::class)
            ->accountBalance($account, CarbonImmutable::createFromFormat('Y-m', $month));
    }

    /** Revenus moins dépenses, mois par mois, sans rémunération. */
    public function test_balance_is_incomes_minus_expenses(): void
    {
        $account = $this->makeAccount();

        Income::create([
            'name' => 'Salaire',
            'amount' => 1000,
            'frequency_type' => 'RECURRING',
            'frequency_months' => 1,
            'start_date_time' => '2025-01-01 00:00:00',
            'end_date_time' => '2025-12-31 00:00:00',
            'account_id' => $account->id,
        ]);

        Expense::create([
            'name' => 'Loyer',
            'amount' => 200,
            'frequency_type' => 'RECURRING',
            'frequency_months' => 1,
            'start_date_time' => '2025-01-01 00:00:00',
            'end_date_time' => '2025-12-31 00:00:00',
            'account_id' => $account->id,
        ]);

        // 12 mois à +800 €.
        $this->assertSame(9600.0, $this->forecast($account, '2025-12')['balance']);

        // À mi-parcours, seuls les 6 premiers mois comptent.
        $this->assertSame(4800.0, $this->forecast($account, '2025-06')['balance']);
    }

    /** Une dépense ponctuelle ne tombe que sur son mois de départ. */
    public function test_one_off_transaction_hits_a_single_month(): void
    {
        $account = $this->makeAccount();

        Expense::create([
            'name' => 'iPhone 19',
            'amount' => 4321,
            'frequency_type' => 'ONCE',
            'start_date_time' => '2025-09-01 00:00:00',
            'account_id' => $account->id,
        ]);

        $this->assertSame(0.0, $this->forecast($account, '2025-08')['balance']);
        $this->assertSame(-4321.0, $this->forecast($account, '2025-09')['balance']);
        // Le mois suivant, elle ne se rejoue pas.
        $this->assertSame(-4321.0, $this->forecast($account, '2025-10')['balance']);
    }

    /** "Tous les 12 mois" ne tombe qu'une fois par an, à partir du mois de départ. */
    public function test_recurring_every_n_months(): void
    {
        $account = $this->makeAccount();

        Income::create([
            'name' => 'Prime',
            'amount' => 150,
            'frequency_type' => 'RECURRING',
            'frequency_months' => 12,
            'start_date_time' => '2025-01-01 00:00:00',
            'end_date_time' => '2027-12-31 00:00:00',
            'account_id' => $account->id,
        ]);

        $this->assertSame(150.0, $this->forecast($account, '2025-11')['balance']);
        $this->assertSame(300.0, $this->forecast($account, '2026-01')['balance']);
        $this->assertSame(450.0, $this->forecast($account, '2027-06')['balance']);
        // Après la date de fin, plus rien ne s'ajoute.
        $this->assertSame(450.0, $this->forecast($account, '2030-01')['balance']);
    }

    /** Le taux annuel est ramené au mois, et les intérêts sont composés. */
    public function test_interest_is_monthly_and_compounded(): void
    {
        // 12 % par an, soit 1 % par mois, sans impôt.
        $account = $this->makeAccount(['remuneration_rate' => 12, 'tax_rate' => 0]);

        Income::create([
            'name' => 'Dépôt',
            'amount' => 1000,
            'frequency_type' => 'ONCE',
            'start_date_time' => '2025-01-01 00:00:00',
            'account_id' => $account->id,
        ]);

        // Premier mois : 1000 + 1 %.
        $this->assertSame(1010.0, $this->forecast($account, '2025-01')['balance']);
        // Deuxième mois : les intérêts rapportent à leur tour (1010 × 1,01).
        $this->assertSame(1020.1, $this->forecast($account, '2025-02')['balance']);
    }

    /** L'impôt s'applique sur les intérêts : le solde affiché est net. */
    public function test_interest_is_net_of_tax(): void
    {
        // 12 % par an (1 %/mois) imposés à 30 % : il reste 0,7 % net par mois.
        $account = $this->makeAccount(['remuneration_rate' => 12, 'tax_rate' => 30]);

        Income::create([
            'name' => 'Dépôt',
            'amount' => 1000,
            'frequency_type' => 'ONCE',
            'start_date_time' => '2025-01-01 00:00:00',
            'account_id' => $account->id,
        ]);

        $result = $this->forecast($account, '2025-01');

        $this->assertSame(1007.0, $result['balance']);
        $this->assertSame(7.0, $result['total_interest']);
    }

    /** Un solde négatif ne rapporte pas d'intérêts. */
    public function test_no_interest_on_a_negative_balance(): void
    {
        $account = $this->makeAccount(['remuneration_rate' => 12]);

        Expense::create([
            'name' => 'Découvert',
            'amount' => 500,
            'frequency_type' => 'ONCE',
            'start_date_time' => '2025-01-01 00:00:00',
            'account_id' => $account->id,
        ]);

        $result = $this->forecast($account, '2025-06');

        $this->assertSame(-500.0, $result['balance']);
        $this->assertSame(0.0, $result['total_interest']);
    }

    /** Une exception remplace le montant sur les mois qu'elle couvre, et seulement ceux-là. */
    public function test_exception_overrides_the_amount_for_the_months_it_covers(): void
    {
        $account = $this->makeAccount();

        $expense = Expense::create([
            'name' => 'Courses',
            'amount' => 200,
            'frequency_type' => 'RECURRING',
            'frequency_months' => 1,
            'start_date_time' => '2025-01-01 00:00:00',
            'end_date_time' => '2025-12-31 00:00:00',
            'account_id' => $account->id,
        ]);

        // Vacances : 150 € au lieu de 200 €, en août seulement.
        $expense->exceptions()->create([
            'name' => 'Vacances estivales',
            'amount' => 150,
            'frequency_type' => 'ONCE',
            'start_date_time' => '2025-08-01 00:00:00',
        ]);

        // 12 × 200 = 2400, moins les 50 € économisés en août.
        $this->assertSame(-2350.0, $this->forecast($account, '2025-12')['balance']);

        // Le montant initial de la dépense n'a pas bougé en base.
        $this->assertSame('200.00', $expense->fresh()->amount);
    }

    /** Le solde d'un compte tout juste créé, sans mouvement, vaut zéro. */
    public function test_empty_account_has_a_zero_balance(): void
    {
        $account = $this->makeAccount();

        $this->assertSame(0.0, $this->forecast($account, '2035-12')['balance']);
    }

    /** L'endpoint agrège les comptes et rend le total consolidé. */
    public function test_forecast_endpoint_returns_every_account_and_the_total(): void
    {
        $user = User::create([
            'name' => 'Test',
            'email' => 'endpoint@example.com',
            'password' => 'password123',
        ]);

        $current = Account::create([
            'name' => 'Compte courant',
            'creation_date' => '2025-01-01',
            'remuneration_rate' => 0,
            'tax_rate' => 0,
            'user_id' => $user->id,
        ]);

        $savings = Account::create([
            'name' => 'Livret A',
            'creation_date' => '2025-01-01',
            'remuneration_rate' => 0,
            'tax_rate' => 0,
            'user_id' => $user->id,
        ]);

        Income::create([
            'name' => 'Salaire',
            'amount' => 1000,
            'frequency_type' => 'ONCE',
            'start_date_time' => '2025-01-01 00:00:00',
            'account_id' => $current->id,
        ]);

        Income::create([
            'name' => 'Épargne',
            'amount' => 500,
            'frequency_type' => 'ONCE',
            'start_date_time' => '2025-01-01 00:00:00',
            'account_id' => $savings->id,
        ]);

        $response = $this->actingAs($user)
            ->getJson('/api/forecast?month=2025-06')
            ->assertOk()
            ->assertJson(['month' => '2025-06', 'total_balance' => 1500]);

        $this->assertCount(2, $response->json('accounts'));
    }

    /** Le mois est obligatoire et doit être au format Y-m. */
    public function test_forecast_endpoint_validates_the_month(): void
    {
        $user = User::create([
            'name' => 'Test',
            'email' => 'validate@example.com',
            'password' => 'password123',
        ]);

        $this->actingAs($user)->getJson('/api/forecast')->assertStatus(422);
        $this->actingAs($user)->getJson('/api/forecast?month=décembre')->assertStatus(422);
    }
}
