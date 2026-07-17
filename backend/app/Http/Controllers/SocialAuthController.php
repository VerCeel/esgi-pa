<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    /**
     * Seuls ces fournisseurs sont acceptés : on ne laisse pas l'URL décider d'un driver
     * arbitraire que Socialite ne saurait pas résoudre.
     */
    private const PROVIDERS = ['google', 'github'];

    /**
     * Étape 1 : on renvoie le navigateur vers le fournisseur.
     * `stateless()` car l'API n'a pas de session — c'est le token Sanctum, pas un cookie,
     * qui portera l'authentification une fois la boucle terminée.
     */
    public function redirect(string $provider)
    {
        abort_unless(in_array($provider, self::PROVIDERS, true), 404);

        return Socialite::driver($provider)->stateless()->redirect();
    }

    /**
     * Étape 2 : le fournisseur nous renvoie ici. On échange le code contre le profil,
     * on retrouve (ou crée) l'utilisateur local, puis on repart vers le front avec un
     * token Sanctum tout neuf. Toute erreur renvoie aussi vers le front, mais en `?error`.
     */
    public function callback(string $provider)
    {
        abort_unless(in_array($provider, self::PROVIDERS, true), 404);

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Throwable $e) {
            Log::warning('Social login failed', ['provider' => $provider, 'error' => $e->getMessage()]);

            return $this->redirectToFrontend(['error' => 'social_failed']);
        }

        $providerId = $socialUser->getId();
        $email = $socialUser->getEmail();

        // Sans identifiant fournisseur ni email, impossible de rattacher le profil à un compte.
        if (! $providerId) {
            return $this->redirectToFrontend(['error' => 'social_failed']);
        }

        // 1) Déjà lié à ce fournisseur ? On le reconnaît directement.
        $user = User::where('provider', $provider)
            ->where('provider_id', $providerId)
            ->first();

        // 2) Sinon, un compte existe peut-être déjà avec cet email (inscription classique) :
        //    on le lie au fournisseur. Les emails Google/GitHub sont vérifiés à la source.
        if (! $user && $email) {
            $user = User::where('email', $email)->first();

            if ($user) {
                $user->forceFill([
                    'provider' => $provider,
                    'provider_id' => $providerId,
                    'email_verified_at' => $user->email_verified_at ?? now(),
                ])->save();
            }
        }

        // 3) Toujours rien : on crée le compte. Le nom peut manquer côté fournisseur —
        //    d'où la valeur de repli tirée de l'email.
        if (! $user) {
            if (! $email) {
                return $this->redirectToFrontend(['error' => 'social_no_email']);
            }

            $user = User::create([
                'name' => $socialUser->getName() ?: Str::before($email, '@'),
                'email' => $email,
                'password' => null,
                'provider' => $provider,
                'provider_id' => $providerId,
            ]);

            $user->forceFill(['email_verified_at' => now()])->save();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return $this->redirectToFrontend(['token' => $token]);
    }

    /**
     * Renvoie vers la page de callback du SPA, qui lira le token (ou l'erreur) dans l'URL.
     */
    private function redirectToFrontend(array $params)
    {
        $frontend = rtrim(config('app.frontend_url'), '/');

        return redirect()->away($frontend . '/auth/callback?' . http_build_query($params));
    }
}
