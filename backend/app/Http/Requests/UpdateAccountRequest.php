<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAccountRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
            'creation_date' => ['sometimes', 'date'],
            // Un taux à 0 est légitime (compte courant) : `sometimes` et pas `nullable`,
            // sinon `!empty()` côté contrôleur avalerait silencieusement la valeur 0.
            'remuneration_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'tax_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
