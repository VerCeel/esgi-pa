<?php

namespace Database\Factories;

use App\Models\Expense;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'description' => fake()->sentence(),
            'amount' => fake()->randomFloat(2, 0, 1000),
            'frequency_type' => fake()->randomElement(['ONCE', 'RECURRING']),
            'frequency_months' => fake()->randomElement([1, 3, 6, 12]),
            'start_date_time' => fake()->dateTime(),
            'end_date_time' => fake()->dateTime(),
            'account_id' => random_int(1, 10),
        ];
    }
}
