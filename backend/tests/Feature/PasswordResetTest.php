<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::create([
            'name' => 'User',
            'email' => 'user@example.com',
            'password' => Hash::make('old-password'),
        ]);
    }

    /** Demander un reset envoie le lien par email. */
    public function test_requesting_a_reset_sends_the_link(): void
    {
        Notification::fake();
        $user = $this->makeUser();

        $this->postJson('/api/forgot-password', ['email' => $user->email])
            ->assertOk();

        Notification::assertSentTo($user, ResetPassword::class);
    }

    /** Un email inconnu renvoie le même message : on ne divulgue pas l'existence du compte. */
    public function test_requesting_a_reset_for_an_unknown_email_does_not_leak(): void
    {
        Notification::fake();

        $this->postJson('/api/forgot-password', ['email' => 'nobody@example.com'])
            ->assertOk();

        Notification::assertNothingSent();
    }

    /** Avec un token valide, le mot de passe est bien changé et les tokens révoqués. */
    public function test_a_valid_token_resets_the_password(): void
    {
        $user = $this->makeUser();
        $user->createToken('auth_token');
        $token = Password::createToken($user);

        $this->postJson('/api/reset-password', [
            'token' => $token,
            'email' => $user->email,
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])->assertOk();

        $this->assertTrue(Hash::check('brand-new-password', $user->fresh()->password));
        // Un reset coupe les sessions ouvertes ailleurs.
        $this->assertSame(0, $user->tokens()->count());
    }

    /** Un token bidon est rejeté et le mot de passe reste inchangé. */
    public function test_an_invalid_token_is_rejected(): void
    {
        $user = $this->makeUser();

        $this->postJson('/api/reset-password', [
            'token' => 'not-a-real-token',
            'email' => $user->email,
            'password' => 'brand-new-password',
            'password_confirmation' => 'brand-new-password',
        ])->assertStatus(422);

        $this->assertTrue(Hash::check('old-password', $user->fresh()->password));
    }
}
