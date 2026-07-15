<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateExpenseRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'frequency_type' => ['sometimes', 'in:ONCE,RECURRING'],
            'frequency_months' => ['nullable', 'required_if:frequency_type,RECURRING', 'integer', 'min:1', 'max:600'],
            'start_date_time' => ['sometimes', 'date'],
            'end_date_time' => ['nullable', 'date', 'after_or_equal:start_date_time'],
            // Déplacer une dépense vers un compte qui n'est pas le sien reviendrait à écrire chez autrui.
            'account_id' => [
                'sometimes',
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
