<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class EmailVerificationController extends Controller
{
    /**
     * Cible du lien signé envoyé par email. On ne passe PAS par le middleware `signed` :
     * il renverrait un 403 JSON brut sur un lien expiré. On valide la signature à la main
     * pour toujours retomber sur une page front lisible (avec option de renvoi).
     */
    public function verify(Request $request, string $id, string $hash)
    {
        if (! $request->hasValidSignature()) {
            return $this->redirectToFrontend('expired');
        }

        $user = User::find($id);

        // Le hash lie le lien à l'email au moment de l'envoi : changer d'email l'invalide.
        if (! $user || ! hash_equals(sha1($user->getEmailForVerification()), (string) $hash)) {
            return $this->redirectToFrontend('invalid');
        }

        if ($user->hasVerifiedEmail()) {
            return $this->redirectToFrontend('already');
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        return $this->redirectToFrontend('success');
    }

    /**
     * Renvoi du lien. Accessible sans session (l'utilisateur ne peut pas encore se
     * connecter) : on identifie par l'email. La réponse est volontairement identique
     * dans tous les cas pour ne pas révéler qui possède un compte.
     */
    public function resend(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email'],
        ]);

        if ($validated->fails()) {
            return response()->json($validated->errors(), 422);
        }

        $user = User::where('email', $request->input('email'))->first();

        if ($user && ! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json([
            'message' => 'If that email still needs verification, a new link is on its way.',
        ], 200);
    }

    /**
     * La page /email-verified du SPA lit `?status` pour afficher le bon message.
     */
    private function redirectToFrontend(string $status)
    {
        $frontend = rtrim(config('app.frontend_url'), '/');

        return redirect()->away($frontend . '/email-verified?status=' . $status);
    }
}
