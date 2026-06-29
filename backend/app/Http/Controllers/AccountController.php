<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAccountRequest;
use App\Http\Requests\UpdateAccountRequest;
use App\Models\Account;
use Illuminate\Support\Facades\Auth;

class AccountController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $currentUser = Auth::user();
        $accounts = $currentUser->accounts;
        return response()->json($accounts);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAccountRequest $request)
    {
        $validated = $request->validated();
        $currentUser = Auth::user();
        $account = Account::create(
            [
                'name' => $validated['name'],
                'description' => $validated['description'],
                'remuneration_rate' => $validated['remuneration_rate'],
                'tax_rate' => $validated['tax_rate'],
                'user_id' => $currentUser->id ?? null,
            ]
        );
        return response()->json($account, 201);
        
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id)
    {
        $account = Account::find($id);
        $currentUser = Auth::user();
        if (!$account || $account->user_id !== $currentUser->id) {
            return response()->json(['message' => 'Account not found'], 404);
        }
        return response()->json($account, 200);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Account $account)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAccountRequest $request, int $id)
    {
        $validated = $request->validated();
        $account = Account::find($id);
        $currentUser = Auth::user();
        if (!$account || $account->user_id !== $currentUser->id) {
            return response()->json(['message' => 'Account not found'], 404);
        }
        if (!empty($validated['name'])) {
            $account->name = $validated['name'];
        }
        if (!empty($validated['description'])) {
            $account->description = $validated['description'];
        }
        if (!empty($validated['remuneration_rate'])) {
            $account->remuneration_rate = $validated['remuneration_rate'];
        }
        if (!empty($validated['tax_rate'])) {
            $account->tax_rate = $validated['tax_rate'];
        }
        $account->save();
        return response()->json($account, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id)
    {
        $account = Account::find($id);
        $currentUser = Auth::user();
        if (!$account || $account->user_id !== $currentUser->id) {
            return response()->json(['message' => 'Account not found'], 404);
        }
        $account->delete();
        return response()->json(['message' => 'Account deleted successfully'], 200);
    }
}
