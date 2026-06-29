<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AccountController;



Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);


Route::group(['middleware' => 'auth:sanctum'], function () {
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::apiResource('/accounts', AccountController::class);
    Route::post('/logout', [AuthController::class, 'logout']);
});