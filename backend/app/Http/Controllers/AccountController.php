<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesAccounts;
use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Models\Account;
use App\Models\AccountShare;
use App\Services\ForecastService;
use App\Services\PlanLimits;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;

class AccountController extends Controller
{
    use ResolvesAccounts;

    public function __construct(
        private ForecastService $forecast,
        private PlanLimits $planLimits,
    ) {}

    /**
     * Les comptes possédés, chacun avec son solde à aujourd'hui.
     * Le sujet exige le solde aussi bien dans la liste que dans le détail.
     */
    public function index()
    {
        $accounts = Auth::user()
            ->accounts()
            ->with(['expenses.exceptions', 'incomes.exceptions'])
            ->get();

        return response()->json(
            $accounts->map(fn (Account $account) => $this->withBalance($account)),
            200,
        );
    }

    /** Les comptes qu'on m'a partagés : mêmes données, mais en lecture seule. */
    public function shared()
    {
        $accounts = Auth::user()
            ->sharedAccounts()
            ->with(['expenses.exceptions', 'incomes.exceptions', 'user:id,name,email'])
            ->get();

        return response()->json(
            $accounts->map(fn (Account $account) => [
                ...$this->withBalance($account),
                'read_only' => true,
                'owner' => $account->user?->only(['id', 'name', 'email']),
            ]),
            200,
        );
    }

    public function store(StoreAccountRequest $request)
    {
        $user = Auth::user();

        if (! $this->planLimits->canCreateAccount($user)) {
            return response()->json([
                'message' => 'Your free plan is limited to ' . PlanLimits::FREE_MAX_ACCOUNTS
                    . ' accounts. Upgrade to add more.',
            ], 403);
        }

        $validated = $request->validated();

        $account = Account::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            // Par défaut, le compte est réputé ouvert aujourd'hui.
            'creation_date' => $validated['creation_date'] ?? CarbonImmutable::now()->toDateString(),
            'remuneration_rate' => $validated['remuneration_rate'] ?? 0,
            'tax_rate' => $validated['tax_rate'] ?? 0,
            'user_id' => $user->id,
        ]);

        return response()->json($this->withBalance($account), 201);
    }

    public function show(int $id)
    {
        $account = $this->readableAccount(Auth::user(), $id);

        if (! $account) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        $account->load(['expenses.exceptions', 'incomes.exceptions']);

        return response()->json([
            ...$this->withBalance($account),
            'expenses' => $account->expenses,
            'incomes' => $account->incomes,
            // Un invité voit tout, mais ne peut rien modifier.
            'read_only' => $account->user_id !== Auth::id(),
        ], 200);
    }

    public function update(UpdateAccountRequest $request, int $id)
    {
        $account = $this->ownedAccount(Auth::user(), $id);

        if (! $account) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        $account->update($request->validated());

        return response()->json($this->withBalance($account->fresh()), 200);
    }

    public function destroy(int $id)
    {
        $account = $this->ownedAccount(Auth::user(), $id);

        if (! $account) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        $account->delete();

        return response()->json(['message' => 'Account deleted successfully'], 200);
    }

    /**
     * L'invité quitte un compte qu'on lui a partagé : on retire son propre partage.
     * Il perd l'accès, mais le compte et ses données restent intacts pour le propriétaire.
     */
    public function leaveShared(int $id)
    {
        $deleted = AccountShare::where('account_id', $id)
            ->where('user_id', Auth::id())
            ->whereNotNull('accepted_at')
            ->delete();

        if (! $deleted) {
            return response()->json(['message' => 'Shared account not found'], 404);
        }

        return response()->json(['message' => 'You left the shared account'], 200);
    }

    /**
     * Le solde d'aujourd'hui, c'est la prévision au mois courant : même moteur que la page
     * de prévisions, pour que les deux ne puissent pas afficher des chiffres différents.
     */
    private function withBalance(Account $account): array
    {
        $projection = $this->forecast->accountBalance($account, CarbonImmutable::now());

        return [
            ...$account->toArray(),
            'balance' => $projection['balance'],
            'total_interest' => $projection['total_interest'],
        ];
    }
}
