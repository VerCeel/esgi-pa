<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use App\Models\User;
use App\Models\Expense;

#[Fillable(['name', 'description', 'remuneration_rate', 'tax_rate', 'user_id'])]

class Account extends Model
{
    /** @use HasFactory<\Database\Factories\AccountFactory> */
    use HasFactory;

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
}
