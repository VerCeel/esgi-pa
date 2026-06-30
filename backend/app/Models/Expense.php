<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use App\Models\Account;

#[Fillable(['name', 'description', 'amount', 'frequency_type', 'frequency_months', 'start_date_time', 'end_date_time', 'account_id'])]

class Expense extends Model
{
    /** @use HasFactory<\Database\Factories\ExpenseFactory> */
    use HasFactory;

    public function account()
    {
        return $this->belongsTo(Account::class);
    }
}
