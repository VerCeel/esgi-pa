<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ExpenseController;




Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


Route::group(['middleware' => 'auth:sanctum'], function () {
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