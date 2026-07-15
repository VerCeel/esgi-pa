<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FiltersTransactions;
use App\Http\Controllers\Concerns\ResolvesAccounts;
use App\Http\Requests\StoreIncomeRequest;
use App\Http\Requests\UpdateIncomeRequest;
use App\Models\Account;
use App\Models\Income;
use App\Services\PlanLimits;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Symétrique d'ExpenseController : un revenu a la même forme qu'une dépense,
 * seul son signe change au moment des prévisions.
 */
class IncomeController extends Controller
{
    use FiltersTransactions, ResolvesAccounts;

    public function __construct(private PlanLimits $planLimits) {}

    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Income::query()
            ->with('account:id,name')
            ->whereIn('account_id', $this->readableAccountIds($user));

        if ($accountId = $request->query('account_id')) {
            $query->where('account_id', $accountId);
        }

        $this->applySearch($query, $request->query('search'));

        return response()->json($query->latest('id')->get(), 200);
    }

    public function store(StoreIncomeRequest $request)
    {
        $validated = $request->validated();
        $user = Auth::user();

        $account = Account::find($validated['account_id']);

        if (! $this->planLimits->canCreateIncome($user, $account)) {
            return response()->json([
                'message' => 'Your free plan is limited to ' . PlanLimits::FREE_MAX_INCOMES_PER_ACCOUNT
                    . ' incomes per account. Upgrade to add more.',
            ], 403);
        }

        return response()->json(Income::create($validated), 201);
    }

    public function show(int $id)
    {
        $income = $this->findReadable($id);

        if (! $income) {
            return response()->json(['message' => 'Income not found'], 404);
        }

        return response()->json($income->load('exceptions'), 200);
    }

    public function update(UpdateIncomeRequest $request, int $id)
    {
        $income = $this->findOwned($id);

        if (! $income) {
            return response()->json(['message' => 'Income not found'], 404);
        }

        $income->update($request->validated());

        return response()->json($income, 200);
    }

    public function destroy(int $id)
    {
        $income = $this->findOwned($id);

        if (! $income) {
            return response()->json(['message' => 'Income not found'], 404);
        }

        $income->delete();

        return response()->json(['message' => 'Income deleted successfully'], 200);
    }

    private function findReadable(int $id): ?Income
    {
        return Income::whereKey($id)
            ->whereIn('account_id', $this->readableAccountIds(Auth::user()))
            ->first();
    }

    private function findOwned(int $id): ?Income
    {
        return $this->scopeToOwnedAccounts(Income::whereKey($id), Auth::user())->first();
    }
}
