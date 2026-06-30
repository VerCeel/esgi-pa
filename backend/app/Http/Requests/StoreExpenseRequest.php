<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreExpenseRequest extends FormRequest
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

        //TODO: Add validation in the controller if the frequency_type is RECURRING, then frequency_months is required
        //if the frequency_type is ONCE, then frequency_months is not required
        //if the frequency_type is RECURRING, then start_date_time is required and must be in the future
        //if the frequency_type is ONCE, then start_date_time is not required and must be in the future
        //if the frequency_type is RECURRING, then end_date_time is not required and must be in the future
        //if the frequency_type is ONCE, then end_date_time is required and must be in the future
        
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'frequency_type' => ['required', 'in:ONCE,RECURRING'],
            'frequency_months' => ['nullable', 'integer'],
            'start_date_time' => ['required', 'date_format:Y-m-d H:i:s'],
            'end_date_time' => ['nullable', 'date_format:Y-m-d H:i:s'],
            'account_id' => ['required', 'exists:accounts,id'],
        ];
    }
}
