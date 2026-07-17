<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    /** L'inscription crée un compte non vérifié, envoie le lien, et NE connecte pas. */
    public function test_register_creates_unverified_user_and_sends_link(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => 'Jane',
            'email' => 'jane@example.com',
            'password' => 'password123',
        ])->assertCreated();

        $this->assertNull($response->json('token'));

        $user = User::where('email', 'jane@example.com')->firstOrFail();
        $this->assertFalse($user->hasVerifiedEmail());
        Notification::assertSentTo($user, VerifyEmail::class);
    }

    /** Tant que l'email n'est pas vérifié, le login est refusé (403). */
    public function test_login_is_blocked_until_email_is_verified(): void
    {
        $user = User::create([
            'name' => 'Jane',
            'email' => 'jane@example.com',
            'password' => 'password123',
        ]);

        $this->postJson('/api/login', [
            'email' => 'jane@example.com',
            'password' => 'password123',
        ])->assertStatus(403)->assertJson(['email_unverified' => true]);

        $user->markEmailAsVerified();

        $this->postJson('/api/login', [
            'email' => 'jane@example.com',
            'password' => 'password123',
        ])->assertOk()->assertJsonStructure(['token']);
    }

    /** Le lien signé marque l'adresse vérifiée puis redirige vers le SPA. */
    public function test_signed_link_verifies_the_email(): void
    {
        $user = User::create([
            'name' => 'Jane',
            'email' => 'jane@example.com',
            'password' => 'password123',
        ]);

        $url = URL::temporarySignedRoute('verification.verify', now()->addMinutes(60), [
            'id' => $user->id,
            'hash' => sha1($user->getEmailForVerification()),
        ]);

        $this->get($url)
            ->assertRedirect()
            ->assertRedirectContains('/email-verified?status=success');

        $this->assertTrue($user->fresh()->hasVerifiedEmail());
    }

    /** Un lien trafiqué/expiré ne vérifie rien et redirige avec un statut d'échec. */
    public function test_tampered_link_does_not_verify(): void
    {
        $user = User::create([
            'name' => 'Jane',
            'email' => 'jane@example.com',
            'password' => 'password123',
        ]);

        $this->get('/api/email/verify/' . $user->id . '/' . sha1($user->email) . '?signature=bogus')
            ->assertRedirect()
            ->assertRedirectContains('/email-verified?status=expired');

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    /** Le renvoi renvoie un lien pour un compte non vérifié, réponse neutre sinon. */
    public function test_resend_sends_a_new_link_for_unverified_account(): void
    {
        Notification::fake();

        $user = User::create([
            'name' => 'Jane',
            'email' => 'jane@example.com',
            'password' => 'password123',
        ]);

        $this->postJson('/api/email/verification-notification', [
            'email' => 'jane@example.com',
        ])->assertOk();

        Notification::assertSentTo($user, VerifyEmail::class);
    }
}
