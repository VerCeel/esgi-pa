<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AccountShareController;
use App\Http\Controllers\ForecastController;
use App\Http\Controllers\IncomeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\TransactionExceptionController;
use App\Http\Controllers\TwoFactorController;




Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Second facteur : accessible sans token Sanctum (l'utilisateur n'en a pas encore),
// protégé par le login_token temporaire + un throttle contre le brute-force du code à 6 chiffres.
Route::post('/2fa/challenge', [TwoFactorController::class, 'challenge'])->middleware('throttle:5,1');

// Stripe appelle cette route depuis ses serveurs : pas de token possible.
// C'est la signature du webhook qui l'authentifie, pas Sanctum.
Route::post('/stripe/webhook', [SubscriptionController::class, 'webhook']);


Route::group(['middleware' => 'auth:sanctum'], function () {
    Route::prefix('2fa')->controller(TwoFactorController::class)->group(function () {
        Route::post('/enable', 'enable');
        Route::post('/confirm', 'confirm');
        Route::post('/disable', 'disable');
        Route::post('/recovery-codes', 'regenerateRecoveryCodes');
    });

    Route::apiResource('/expenses', ExpenseController::class);
    Route::apiResource('/incomes', IncomeController::class);

    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Doit précéder /accounts/{account}, sinon "shared" serait pris pour un identifiant.
    Route::get('/accounts/shared', [AccountController::class, 'shared']);
    Route::apiResource('/accounts', AccountController::class);

    // État des comptes à un mois donné (?month=2035-12).
    Route::get('/forecast', [ForecastController::class, 'index']);

    // Exceptions : toujours abordées par leur transaction parente, ce qui rend
    // impossible d'en greffer une sur la dépense de quelqu'un d'autre.
    Route::controller(TransactionExceptionController::class)->group(function () {
        Route::get('/expenses/{expense}/exceptions', 'indexForExpense');
        Route::post('/expenses/{expense}/exceptions', 'storeForExpense');
        Route::get('/incomes/{income}/exceptions', 'indexForIncome');
        Route::post('/incomes/{income}/exceptions', 'storeForIncome');
        Route::patch('/exceptions/{exception}', 'update');
        Route::delete('/exceptions/{exception}', 'destroy');
    });

    // Partage d'un compte en lecture seule.
    Route::controller(AccountShareController::class)->group(function () {
        Route::get('/accounts/{account}/shares', 'index');
        Route::post('/accounts/{account}/shares', 'store');
        Route::delete('/accounts/{account}/shares/{share}', 'destroy');
        Route::post('/shares/{token}/accept', 'accept');
    });

    Route::prefix('subscription')->controller(SubscriptionController::class)->group(function () {
        Route::get('/', 'show');
        Route::post('/checkout', 'checkout');
        Route::post('/cancel', 'cancel');
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    Route::prefix('profile')->controller(ProfileController::class)->group(function () {
        Route::get('/', 'show');
        Route::patch('/', 'update');
    });
});
