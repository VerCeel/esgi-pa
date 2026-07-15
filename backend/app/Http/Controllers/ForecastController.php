<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesAccounts;
use App\Models\Account;
use App\Services\ForecastService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ForecastController extends Controller
{
    use ResolvesAccounts;

    public function __construct(private ForecastService $forecast) {}

    /**
     * État des comptes à la fin d'un mois donné (?month=2035-12).
     *
     * Prend en compte toutes les dépenses, tous les revenus, leurs exceptions, et les
     * intérêts nets d'impôt des comptes rémunérés, composés mois après mois.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
        ]);

        $user = Auth::user();

        $accounts = Account::query()
            ->whereIn('id', $this->readableAccountIds($user))
            ->with(['expenses.exceptions', 'incomes.exceptions'])
            ->get();

        $targetMonth = CarbonImmutable::createFromFormat('Y-m', $validated['month'])->startOfMonth();

        return response()->json($this->forecast->forecast($accounts, $targetMonth), 200);
    }
}
