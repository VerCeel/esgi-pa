<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PragmaRX\Google2FA\Google2FA;
use Tests\TestCase;

class TwoFactorTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(): User
    {
        return User::create([
            'name' => 'Test',
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);
    }

    /** Le flow complet : enable -> confirm -> login -> challenge. */
    public function test_full_two_factor_flow(): void
    {
        $user = $this->makeUser();

        // 1. Enrôlement : on récupère le secret + le QR code.
        $enable = $this->actingAs($user)->postJson('/api/2fa/enable')->assertOk();
        $secret = $enable->json('secret');
        $this->assertNotEmpty($secret);
        $this->assertStringStartsWith('data:image/svg+xml;base64,', $enable->json('qr_code'));

        // Tant que ce n'est pas confirmé, le 2FA n'est pas actif.
        $this->assertFalse($user->fresh()->hasTwoFactorEnabled());

        // 2. Confirmation avec un code TOTP valide -> on reçoit les codes de secours.
        $code = (new Google2FA())->getCurrentOtp($secret);
        $confirm = $this->actingAs($user)->postJson('/api/2fa/confirm', ['code' => $code])->assertOk();
        $recoveryCodes = $confirm->json('recovery_codes');
        $this->assertCount(8, $recoveryCodes);
        $this->assertTrue($user->fresh()->hasTwoFactorEnabled());

        // 3. Login : plus de token Sanctum direct, juste un login_token temporaire.
        $login = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ])->assertOk()->assertJson(['two_factor' => true]);

        $this->assertNull($login->json('token'));
        $loginToken = $login->json('login_token');
        $this->assertNotEmpty($loginToken);

        // 4a. Un mauvais code est rejeté.
        $this->postJson('/api/2fa/challenge', [
            'login_token' => $loginToken,
            'code' => '000000',
        ])->assertStatus(422);

        // 4b. Le bon code donne le vrai token Sanctum.
        $challenge = $this->postJson('/api/2fa/challenge', [
            'login_token' => $loginToken,
            'code' => (new Google2FA())->getCurrentOtp($secret),
        ])->assertOk();

        $token = $challenge->json('token');
        $this->assertNotEmpty($token);

        // Et ce token ouvre bien les routes protégées.
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/profile')
            ->assertOk()
            ->assertJson(['two_factor_enabled' => true]);
    }

    /** Un code de secours marche à la place du TOTP, mais une seule fois. */
    public function test_recovery_code_is_single_use(): void
    {
        $user = $this->makeUser();
        $secret = $this->actingAs($user)->postJson('/api/2fa/enable')->json('secret');
        $recoveryCodes = $this->actingAs($user)
            ->postJson('/api/2fa/confirm', ['code' => (new Google2FA())->getCurrentOtp($secret)])
            ->json('recovery_codes');

        $recoveryCode = $recoveryCodes[0];

        $loginToken = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ])->json('login_token');

        $this->postJson('/api/2fa/challenge', [
            'login_token' => $loginToken,
            'recovery_code' => $recoveryCode,
        ])->assertOk();

        $this->assertCount(7, $user->fresh()->two_factor_recovery_codes);

        // Rejoué une deuxième fois, le même code ne passe plus.
        $newLoginToken = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ])->json('login_token');

        $this->postJson('/api/2fa/challenge', [
            'login_token' => $newLoginToken,
            'recovery_code' => $recoveryCode,
        ])->assertStatus(422);
    }

    /** Le login_token est à usage unique et ne peut pas être rejoué. */
    public function test_login_token_cannot_be_replayed(): void
    {
        $user = $this->makeUser();
        $secret = $this->actingAs($user)->postJson('/api/2fa/enable')->json('secret');
        $this->actingAs($user)->postJson('/api/2fa/confirm', ['code' => (new Google2FA())->getCurrentOtp($secret)]);

        $loginToken = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ])->json('login_token');

        $this->postJson('/api/2fa/challenge', [
            'login_token' => $loginToken,
            'code' => (new Google2FA())->getCurrentOtp($secret),
        ])->assertOk();

        $this->postJson('/api/2fa/challenge', [
            'login_token' => $loginToken,
            'code' => (new Google2FA())->getCurrentOtp($secret),
        ])->assertStatus(401);
    }

    /** Sans 2FA, le login rend le token directement — le comportement existant ne change pas. */
    public function test_login_without_two_factor_still_returns_token(): void
    {
        $this->makeUser();

        $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ])->assertOk()
            ->assertJson(['two_factor' => false])
            ->assertJsonStructure(['token']);
    }

    /** Désactiver le 2FA exige le mot de passe, pas juste un token volé. */
    public function test_disable_requires_password(): void
    {
        $user = $this->makeUser();
        $secret = $this->actingAs($user)->postJson('/api/2fa/enable')->json('secret');
        $this->actingAs($user)->postJson('/api/2fa/confirm', ['code' => (new Google2FA())->getCurrentOtp($secret)]);

        $this->actingAs($user)->postJson('/api/2fa/disable', ['password' => 'wrong'])->assertStatus(422);
        $this->assertTrue($user->fresh()->hasTwoFactorEnabled());

        $this->actingAs($user)->postJson('/api/2fa/disable', ['password' => 'password123'])->assertOk();
        $this->assertFalse($user->fresh()->hasTwoFactorEnabled());
    }
}
