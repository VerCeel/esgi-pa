<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateExpenseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'amount' => ['nullable', 'numeric', 'min:0'],
            'frequency_type' => ['nullable', 'in:ONCE,RECURRING'],
            'frequency_months' => ['nullable', 'integer'],
            'start_date_time' => ['nullable', 'date_format:Y-m-d H:i:s'],
            'end_date_time' => ['nullable', 'date_format:Y-m-d H:i:s'],
            'account_id' => ['nullable', 'exists:accounts,id'],
        ];
    }
}
