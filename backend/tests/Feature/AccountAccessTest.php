<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Expense;
use App\Models\User;
use App\Services\PlanLimits;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AccountAccessTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $email): User
    {
        return User::create([
            'name' => 'User',
            'email' => $email,
            'password' => 'password123',
        ]);
    }

    private function makeAccount(User $user, string $name = 'Compte'): Account
    {
        return Account::create([
            'name' => $name,
            'creation_date' => '2025-01-01',
            'remuneration_rate' => 0,
            'tax_rate' => 0,
            'user_id' => $user->id,
        ]);
    }

    private function expensePayload(Account $account): array
    {
        return [
            'name' => 'Courses',
            'amount' => 100,
            'frequency_type' => 'ONCE',
            'start_date_time' => '2025-03-01 00:00:00',
            'account_id' => $account->id,
        ];
    }

    /**
     * La faille d'origine : `exists:accounts,id` sans clause sur le propriétaire laissait
     * n'importe quel utilisateur connecté écrire dans le compte d'un autre.
     */
    public function test_a_user_cannot_create_an_expense_on_someone_elses_account(): void
    {
        $victim = $this->makeUser('victim@example.com');
        $attacker = $this->makeUser('attacker@example.com');
        $account = $this->makeAccount($victim);

        $this->actingAs($attacker)
            ->postJson('/api/expenses', $this->expensePayload($account))
            ->assertStatus(422)
            ->assertJsonValidationErrors('account_id');

        $this->assertSame(0, Expense::count());
    }

    /** Même chose pour un déplacement : on ne pousse pas une dépense chez autrui. */
    public function test_a_user_cannot_move_an_expense_into_someone_elses_account(): void
    {
        $victim = $this->makeUser('victim@example.com');
        $attacker = $this->makeUser('attacker@example.com');

        $victimAccount = $this->makeAccount($victim);
        $attackerAccount = $this->makeAccount($attacker);

        $expense = Expense::create($this->expensePayload($attackerAccount));

        $this->actingAs($attacker)
            ->patchJson("/api/expenses/{$expense->id}", ['account_id' => $victimAccount->id])
            ->assertStatus(422);

        $this->assertSame($attackerAccount->id, $expense->fresh()->account_id);
    }

    /** Les dépenses d'un autre utilisateur ne sont ni visibles, ni modifiables. */
    public function test_expenses_of_other_users_are_invisible(): void
    {
        $victim = $this->makeUser('victim@example.com');
        $attacker = $this->makeUser('attacker@example.com');

        $expense = Expense::create($this->expensePayload($this->makeAccount($victim)));

        $this->actingAs($attacker)->getJson("/api/expenses/{$expense->id}")->assertStatus(404);
        $this->actingAs($attacker)->deleteJson("/api/expenses/{$expense->id}")->assertStatus(404);
        $this->actingAs($attacker)->getJson('/api/expenses')->assertOk()->assertJsonCount(0);

        $this->assertSame(1, Expense::count());
    }

    /** Le plan gratuit plafonne le nombre de comptes. */
    public function test_free_plan_caps_the_number_of_accounts(): void
    {
        $user = $this->makeUser('free@example.com');

        for ($i = 0; $i < PlanLimits::FREE_MAX_ACCOUNTS; $i++) {
            $this->actingAs($user)
                ->postJson('/api/accounts', ['name' => "Compte {$i}"])
                ->assertStatus(201);
        }

        $this->actingAs($user)
            ->postJson('/api/accounts', ['name' => 'Celui de trop'])
            ->assertStatus(403);

        $this->assertSame(PlanLimits::FREE_MAX_ACCOUNTS, $user->accounts()->count());
    }

    /** Le plan gratuit plafonne aussi les dépenses, compte par compte. */
    public function test_free_plan_caps_expenses_per_account(): void
    {
        $user = $this->makeUser('free@example.com');
        $account = $this->makeAccount($user);

        for ($i = 0; $i < PlanLimits::FREE_MAX_EXPENSES_PER_ACCOUNT; $i++) {
            $this->actingAs($user)
                ->postJson('/api/expenses', $this->expensePayload($account))
                ->assertStatus(201);
        }

        $this->actingAs($user)
            ->postJson('/api/expenses', $this->expensePayload($account))
            ->assertStatus(403);
    }

    /** Un abonné payant n'a plus aucune limite. */
    public function test_premium_plan_has_no_limits(): void
    {
        $user = $this->makeUser('premium@example.com');
        $user->forceFill(['plan' => 'PREMIUM'])->save();

        for ($i = 0; $i < PlanLimits::FREE_MAX_ACCOUNTS + 2; $i++) {
            $this->actingAs($user)
                ->postJson('/api/accounts', ['name' => "Compte {$i}"])
                ->assertStatus(201);
        }

        $this->assertSame(PlanLimits::FREE_MAX_ACCOUNTS + 2, $user->accounts()->count());
    }

    /** Le solde est présent dans la liste des comptes, comme l'exige le sujet. */
    public function test_account_list_exposes_the_balance(): void
    {
        $user = $this->makeUser('balance@example.com');
        $account = $this->makeAccount($user);

        Expense::create([
            'name' => 'Loyer',
            'amount' => 300,
            'frequency_type' => 'ONCE',
            'start_date_time' => '2025-02-01 00:00:00',
            'account_id' => $account->id,
        ]);

        $this->actingAs($user)
            ->getJson('/api/accounts')
            ->assertOk()
            ->assertJsonPath('0.balance', -300);
    }

    /** Le filtre porte sur le nom court ET la description. */
    public function test_expenses_can_be_filtered_by_name_or_description(): void
    {
        $user = $this->makeUser('filter@example.com');
        $account = $this->makeAccount($user);

        Expense::create([
            ...$this->expensePayload($account),
            'name' => 'Crédit Moto',
            'description' => 'Crédit pour la Triumph Tiger',
        ]);

        Expense::create([
            ...$this->expensePayload($account),
            'name' => 'Courses',
            'description' => 'Alimentation',
        ]);

        $this->actingAs($user)->getJson('/api/expenses?search=moto')->assertOk()->assertJsonCount(1);
        $this->actingAs($user)->getJson('/api/expenses?search=Triumph')->assertOk()->assertJsonCount(1);
        $this->actingAs($user)->getJson('/api/expenses?search=zzz')->assertOk()->assertJsonCount(0);
        // Un joker saisi par l'utilisateur doit rester un caractère littéral.
        $this->actingAs($user)->getJson('/api/expenses?search=%')->assertOk()->assertJsonCount(0);
    }

    /** Un compte partagé est visible par l'invité, mais en lecture seule. */
    public function test_a_shared_account_is_readable_but_not_writable(): void
    {
        Notification::fake();

        $owner = $this->makeUser('owner@example.com');
        $guest = $this->makeUser('guest@example.com');
        $account = $this->makeAccount($owner, 'Compte partagé');

        Expense::create($this->expensePayload($account));

        // Le propriétaire invite l'autre utilisateur.
        $this->actingAs($owner)
            ->postJson("/api/accounts/{$account->id}/shares", ['email' => 'guest@example.com'])
            ->assertStatus(201);

        $token = $account->shares()->first()->token;

        // Tant que l'invitation n'est pas acceptée, l'invité ne voit rien.
        $this->actingAs($guest)->getJson('/api/accounts/shared')->assertOk()->assertJsonCount(0);
        $this->actingAs($guest)->getJson("/api/accounts/{$account->id}")->assertStatus(404);

        $this->actingAs($guest)->postJson("/api/shares/{$token}/accept")->assertOk();

        // Une fois acceptée : lecture du compte et de ses dépenses.
        $this->actingAs($guest)->getJson('/api/accounts/shared')->assertOk()->assertJsonCount(1);
        $this->actingAs($guest)
            ->getJson("/api/accounts/{$account->id}")
            ->assertOk()
            ->assertJson(['read_only' => true]);
        $this->actingAs($guest)->getJson('/api/expenses')->assertOk()->assertJsonCount(1);

        // Mais aucune écriture : ni sur le compte, ni sur ses dépenses.
        $this->actingAs($guest)
            ->patchJson("/api/accounts/{$account->id}", ['name' => 'Détourné'])
            ->assertStatus(404);
        $this->actingAs($guest)->deleteJson("/api/accounts/{$account->id}")->assertStatus(404);
        $this->actingAs($guest)
            ->deleteJson('/api/expenses/' . $account->expenses()->first()->id)
            ->assertStatus(404);

        $this->assertSame('Compte partagé', $account->fresh()->name);
    }

    /**
     * Régression : la FK des dépenses n'avait pas de ON DELETE CASCADE, donc supprimer
     * un compte qui portait des dépenses (souvent, un compte qu'on venait de partager)
     * échouait. La descendance doit maintenant partir avec le compte.
     */
    public function test_deleting_an_account_removes_its_expenses_incomes_and_shares(): void
    {
        Notification::fake();

        $owner = $this->makeUser('owner@example.com');
        $guest = $this->makeUser('guest@example.com');
        $account = $this->makeAccount($owner);

        $expense = Expense::create($this->expensePayload($account));

        $this->actingAs($owner)
            ->postJson("/api/accounts/{$account->id}/shares", ['email' => 'guest@example.com'])
            ->assertStatus(201);
        $token = $account->shares()->first()->token;
        $this->actingAs($guest)->postJson("/api/shares/{$token}/accept")->assertOk();

        $this->actingAs($owner)
            ->deleteJson("/api/accounts/{$account->id}")
            ->assertOk();

        $this->assertDatabaseMissing('accounts', ['id' => $account->id]);
        $this->assertDatabaseMissing('expenses', ['id' => $expense->id]);
        $this->assertSame(0, \App\Models\AccountShare::count());
    }

    /** L'invité peut quitter un compte partagé : son accès tombe, le compte survit. */
    public function test_a_guest_can_leave_a_shared_account(): void
    {
        Notification::fake();

        $owner = $this->makeUser('owner@example.com');
        $guest = $this->makeUser('guest@example.com');
        $account = $this->makeAccount($owner, 'Compte partagé');

        $this->actingAs($owner)
            ->postJson("/api/accounts/{$account->id}/shares", ['email' => 'guest@example.com'])
            ->assertStatus(201);
        $token = $account->shares()->first()->token;
        $this->actingAs($guest)->postJson("/api/shares/{$token}/accept")->assertOk();
        $this->actingAs($guest)->getJson('/api/accounts/shared')->assertJsonCount(1);

        $this->actingAs($guest)
            ->deleteJson("/api/accounts/shared/{$account->id}")
            ->assertOk();

        // L'invité n'a plus accès…
        $this->actingAs($guest)->getJson('/api/accounts/shared')->assertJsonCount(0);
        // …mais le compte et son propriétaire sont intacts.
        $this->assertDatabaseHas('accounts', ['id' => $account->id]);
        $this->actingAs($owner)->getJson('/api/accounts')->assertOk()->assertJsonCount(1);
    }

    /** On ne peut pas « quitter » un compte qui ne nous a pas été partagé. */
    public function test_leaving_an_account_not_shared_with_you_is_a_404(): void
    {
        $owner = $this->makeUser('owner@example.com');
        $stranger = $this->makeUser('stranger@example.com');
        $account = $this->makeAccount($owner);

        $this->actingAs($stranger)
            ->deleteJson("/api/accounts/shared/{$account->id}")
            ->assertStatus(404);
    }

    /** Un lien d'invitation qui fuite ne sert à rien : il est lié à une adresse email. */
    public function test_an_invitation_cannot_be_accepted_from_another_account(): void
    {
        Notification::fake();

        $owner = $this->makeUser('owner@example.com');
        $guest = $this->makeUser('guest@example.com');
        $stranger = $this->makeUser('stranger@example.com');
        $account = $this->makeAccount($owner);

        $this->actingAs($owner)
            ->postJson("/api/accounts/{$account->id}/shares", ['email' => 'guest@example.com'])
            ->assertStatus(201);

        $token = $account->shares()->first()->token;

        $this->actingAs($stranger)->postJson("/api/shares/{$token}/accept")->assertStatus(403);
        $this->actingAs($guest)->postJson("/api/shares/{$token}/accept")->assertOk();
    }

    /** Le propriétaire peut retirer un partage : l'accès tombe immédiatement. */
    public function test_revoking_a_share_removes_access(): void
    {
        Notification::fake();

        $owner = $this->makeUser('owner@example.com');
        $guest = $this->makeUser('guest@example.com');
        $account = $this->makeAccount($owner);

        $this->actingAs($owner)
            ->postJson("/api/accounts/{$account->id}/shares", ['email' => 'guest@example.com'])
            ->assertStatus(201);

        $share = $account->shares()->first();
        $this->actingAs($guest)->postJson("/api/shares/{$share->token}/accept")->assertOk();
        $this->actingAs($guest)->getJson('/api/accounts/shared')->assertJsonCount(1);

        $this->actingAs($owner)
            ->deleteJson("/api/accounts/{$account->id}/shares/{$share->id}")
            ->assertOk();

        $this->actingAs($guest)->getJson('/api/accounts/shared')->assertJsonCount(0);
        $this->actingAs($guest)->getJson("/api/accounts/{$account->id}")->assertStatus(404);
    }
}
