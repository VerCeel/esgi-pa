<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreIncomeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'frequency_type' => ['required', 'in:ONCE,RECURRING'],
            // "Tous les N mois" n'a de sens que pour une récurrence, et N doit valoir au moins 1.
            'frequency_months' => ['nullable', 'required_if:frequency_type,RECURRING', 'integer', 'min:1', 'max:600'],
            'start_date_time' => ['required', 'date'],
            'end_date_time' => ['nullable', 'date', 'after_or_equal:start_date_time'],
            // On ne peut rattacher un revenu qu'à un compte dont on est propriétaire :
            // sans cette clause, n'importe qui pourrait écrire dans le compte d'un autre.
            'account_id' => [
                'required',
                Rule::exists('accounts', 'id')->where('user_id', $this->user()->id),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'account_id.exists' => 'The selected account does not exist or does not belong to you.',
        ];
    }
}
