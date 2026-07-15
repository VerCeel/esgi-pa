<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\FiltersTransactions;
use App\Http\Controllers\Concerns\ResolvesAccounts;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Account;
use App\Models\Expense;
use App\Services\PlanLimits;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ExpenseController extends Controller
{
    use FiltersTransactions, ResolvesAccounts;

    public function __construct(private PlanLimits $planLimits) {}

    /**
     * Liste plate des dépenses, filtrable par nom court ou description (?search=)
     * et restreignable à un compte (?account_id=).
     *
     * Les comptes partagés apparaissent aussi : l'invité doit voir leurs dépenses.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $query = Expense::query()
            ->with('account:id,name')
            ->whereIn('account_id', $this->readableAccountIds($user));

        if ($accountId = $request->query('account_id')) {
            $query->where('account_id', $accountId);
        }

        $this->applySearch($query, $request->query('search'));

        return response()->json($query->latest('id')->get(), 200);
    }

    public function store(StoreExpenseRequest $request)
    {
        $validated = $request->validated();
        $user = Auth::user();

        // Le compte appartient forcément à l'utilisateur : la Form Request l'a vérifié.
        $account = Account::find($validated['account_id']);

        if (! $this->planLimits->canCreateExpense($user, $account)) {
            return response()->json([
                'message' => 'Your free plan is limited to ' . PlanLimits::FREE_MAX_EXPENSES_PER_ACCOUNT
                    . ' expenses per account. Upgrade to add more.',
            ], 403);
        }

        return response()->json(Expense::create($validated), 201);
    }

    public function show(int $id)
    {
        $expense = $this->findReadable($id);

        if (! $expense) {
            return response()->json(['message' => 'Expense not found'], 404);
        }

        return response()->json($expense->load('exceptions'), 200);
    }

    public function update(UpdateExpenseRequest $request, int $id)
    {
        $expense = $this->findOwned($id);

        if (! $expense) {
            return response()->json(['message' => 'Expense not found'], 404);
        }

        $expense->update($request->validated());

        return response()->json($expense, 200);
    }

    public function destroy(int $id)
    {
        $expense = $this->findOwned($id);

        if (! $expense) {
            return response()->json(['message' => 'Expense not found'], 404);
        }

        $expense->delete();

        return response()->json(['message' => 'Expense deleted successfully'], 200);
    }

    /** Lisible = compte possédé ou partagé. */
    private function findReadable(int $id): ?Expense
    {
        return Expense::whereKey($id)
            ->whereIn('account_id', $this->readableAccountIds(Auth::user()))
            ->first();
    }

    /** Modifiable = compte possédé uniquement, un partage restant en lecture seule. */
    private function findOwned(int $id): ?Expense
    {
        return $this->scopeToOwnedAccounts(Expense::whereKey($id), Auth::user())->first();
    }
}
