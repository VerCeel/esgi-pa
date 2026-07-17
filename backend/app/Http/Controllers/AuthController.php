<?php

namespace App\Http\Controllers;

use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;


class AuthController extends Controller
{
    public function register(Request $request)
    {

        
        $validated = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validated->fails()) {
            return response()->json($validated->errors(), 422);
        }

        $user = User::create([
            'name' => $request['name'],
            'email' => $request['email'],
            'password' => Hash::make($request['password']),
        ]);

        // On ne délivre pas de session tout de suite : l'utilisateur doit d'abord
        // confirmer son adresse via le lien signé qu'on lui envoie ici.
        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Account created. Check your inbox to verify your email before signing in.',
            'user' => $user,
        ], 201);
    }

    public function login(Request $request)
    {
        $user = User::where('email', $request->email)->first();

        // Hash::check même sans utilisateur trouvé serait idéal contre le timing attack,
        // mais on reste sur un message d'erreur unique pour ne pas révéler si l'email existe.
        if (!$user || !Hash::check((string) $request->input('password'), $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        // Mot de passe bon : on peut maintenant révéler au propriétaire du compte que
        // son email n'est pas vérifié (le front proposera de renvoyer le lien). On ne
        // délivre aucune session tant que l'adresse n'est pas confirmée.
        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Please verify your email address before signing in.',
                'email_unverified' => true,
            ], 403);
        }

        // Mot de passe bon, mais ce n'est que le premier facteur : on ne délivre pas encore
        // de token Sanctum. On rend un jeton temporaire à échanger sur /2fa/challenge.
        if ($user->hasTwoFactorEnabled()) {
            $loginToken = Str::random(64);

            Cache::put(
                'two_factor_login:' . hash('sha256', $loginToken),
                $user->id,
                now()->addMinutes(5),
            );

            return response()->json([
                'message' => 'Two-factor authentication required',
                'two_factor' => true,
                'login_token' => $loginToken,
            ], 200);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'two_factor' => false,
            'token' => $token,
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->noContent();
    }

    /**
     * Étape 1 du reset : on envoie le lien par email si l'adresse existe.
     * La réponse est volontairement identique dans tous les cas — on ne révèle jamais
     * si un email est enregistré ou non.
     */
    public function forgotPassword(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email'],
        ]);

        if ($validated->fails()) {
            return response()->json($validated->errors(), 422);
        }

        Password::sendResetLink($request->only('email'));

        return response()->json([
            'message' => 'If that email is registered, a password reset link is on its way.',
        ], 200);
    }

    /**
     * Étape 2 : le token reçu par email + le nouveau mot de passe.
     * Un reset réussi révoque tous les tokens Sanctum existants : les sessions ouvertes
     * ailleurs (potentiellement celles d'un intrus) sont coupées net.
     */
    public function resetPassword(Request $request)
    {
        $validated = Validator::make($request->all(), [
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validated->fails()) {
            return response()->json($validated->errors(), 422);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill(['password' => Hash::make($password)])->save();
                $user->tokens()->delete();
                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)], 422);
        }

        return response()->json(['message' => 'Your password has been reset. You can now sign in.'], 200);
    }
}
