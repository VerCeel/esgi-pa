<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesAccounts;
use App\Http\Requests\StoreTransactionExceptionRequest;
use App\Http\Requests\UpdateTransactionExceptionRequest;
use App\Models\Expense;
use App\Models\Income;
use App\Models\TransactionException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

/**
 * Les exceptions sont toujours abordées par leur transaction parente
 * (/expenses/{id}/exceptions ou /incomes/{id}/exceptions) : c'est ce qui garantit
 * qu'on ne peut pas en greffer une sur la dépense de quelqu'un d'autre.
 */
class TransactionExceptionController extends Controller
{
    use ResolvesAccounts;

    public function indexForExpense(int $expenseId)
    {
        return $this->listFor($this->ownedExpense($expenseId), 'Expense');
    }

    public function indexForIncome(int $incomeId)
    {
        return $this->listFor($this->ownedIncome($incomeId), 'Income');
    }

    public function storeForExpense(StoreTransactionExceptionRequest $request, int $expenseId)
    {
        return $this->createFor($this->ownedExpense($expenseId), $request->validated(), 'Expense');
    }

    public function storeForIncome(StoreTransactionExceptionRequest $request, int $incomeId)
    {
        return $this->createFor($this->ownedIncome($incomeId), $request->validated(), 'Income');
    }

    public function update(UpdateTransactionExceptionRequest $request, int $id)
    {
        $exception = $this->ownedException($id);

        if (! $exception) {
            return response()->json(['message' => 'Exception not found'], 404);
        }

        $exception->update($request->validated());

        return response()->json($exception, 200);
    }

    public function destroy(int $id)
    {
        $exception = $this->ownedException($id);

        if (! $exception) {
            return response()->json(['message' => 'Exception not found'], 404);
        }

        $exception->delete();

        return response()->json(['message' => 'Exception deleted successfully'], 200);
    }

    private function listFor(?Model $transaction, string $label)
    {
        if (! $transaction) {
            return response()->json(['message' => "{$label} not found"], 404);
        }

        return response()->json($transaction->exceptions()->latest('id')->get(), 200);
    }

    private function createFor(?Model $transaction, array $attributes, string $label)
    {
        if (! $transaction) {
            return response()->json(['message' => "{$label} not found"], 404);
        }

        return response()->json($transaction->exceptions()->create($attributes), 201);
    }

    private function ownedExpense(int $id): ?Expense
    {
        return $this->scopeToOwnedAccounts(Expense::whereKey($id), Auth::user())->first();
    }

    private function ownedIncome(int $id): ?Income
    {
        return $this->scopeToOwnedAccounts(Income::whereKey($id), Auth::user())->first();
    }

    /**
     * Une exception n'est modifiable que si la transaction qu'elle surcharge
     * appartient bien à l'utilisateur.
     */
    private function ownedException(int $id): ?TransactionException
    {
        $exception = TransactionException::with('exceptionable.account')->find($id);

        if (! $exception || $exception->exceptionable?->account?->user_id !== Auth::id()) {
            return null;
        }

        return $exception;
    }
}
