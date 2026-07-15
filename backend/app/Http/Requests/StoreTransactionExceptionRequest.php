<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreTransactionExceptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Le rattachement (dépense ou revenu) vient de l'URL, pas du corps de la requête :
     * l'utilisateur ne peut donc pas greffer une exception sur la transaction d'un autre.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'frequency_type' => ['required', 'in:ONCE,RECURRING'],
            'frequency_months' => ['nullable', 'required_if:frequency_type,RECURRING', 'integer', 'min:1', 'max:600'],
            'start_date_time' => ['required', 'date'],
            'end_date_time' => ['nullable', 'date', 'after_or_equal:start_date_time'],
        ];
    }
}
