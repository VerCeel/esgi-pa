<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\TwoFactorController;




Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Second facteur : accessible sans token Sanctum (l'utilisateur n'en a pas encore),
// protégé par le login_token temporaire + un throttle contre le brute-force du code à 6 chiffres.
Route::post('/2fa/challenge', [TwoFactorController::class, 'challenge'])->middleware('throttle:5,1');


Route::group(['middleware' => 'auth:sanctum'], function () {
    Route::prefix('2fa')->controller(TwoFactorController::class)->group(function () {
        Route::post('/enable', 'enable');
        Route::post('/confirm', 'confirm');
        Route::post('/disable', 'disable');
        Route::post('/recovery-codes', 'regenerateRecoveryCodes');
    });

    Route::apiResource('/expenses', ExpenseController::class);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::apiResource('/accounts', AccountController::class);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::prefix('profile')->controller(ProfileController::class)->group(function () {
        Route::get('/', 'show');
        Route::patch('/', 'update');
    });
});