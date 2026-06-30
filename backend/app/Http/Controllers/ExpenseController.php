<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Models\Expense;
use Illuminate\Support\Facades\Auth;

class ExpenseController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $currentUser = Auth::user();
        $expenses = $currentUser->accounts()->with('expenses')->get();
        return response()->json($expenses, 200);
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
    public function store(StoreExpenseRequest $request)
    {
        $validated = $request->validated();
        $expense = Expense::create($validated);
        return response()->json($expense, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(int $id)
    {
        $expense = Expense::find($id);
        $currentUser = Auth::user();
        if (!$expense || $expense->account->user_id !== $currentUser->id) {
            return response()->json(['message' => 'Expense not found'], 404);
        }
        return response()->json($expense, 200);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Expense $expense)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateExpenseRequest $request, int $id)
    {
        $expense = Expense::find($id);
        $currentUser = Auth::user();
        if (!$expense || $expense->account->user_id !== $currentUser->id) {
            return response()->json(['message' => 'Expense not found'], 404);
        }
        $validated = $request->validated();
        $expense->update(
            [
                'name' => $request['name'] ?? $expense->name,
                'description' => $request['description'] ?? $expense->description,
                'amount' => $request['amount'] ?? $expense->amount,
                'frequency_type' => $request['frequency_type'] ?? $expense->frequency_type,
                'frequency_months' => $request['frequency_months'] ?? $expense->frequency_months,
                'start_date_time' => $request['start_date_time'] ?? $expense->start_date_time,
                'end_date_time' => $request['end_date_time'] ?? $expense->end_date_time,
            ]
        );
        $expense->save();
        return response()->json($expense, 200);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(int $id)
    {
        $expense = Expense::find($id);
        $currentUser = Auth::user();
        if (!$expense || $expense->account->user_id !== $currentUser->id) {
            return response()->json(['message' => 'Expense not found'], 404);
        }
        $expense->delete();
        return response()->json(['message' => 'Expense deleted successfully'], 200);
    }
}
