<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\TwoFactorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TwoFactorController extends Controller
{
    public function __construct(private TwoFactorService $twoFactor) {}

    /**
     * Étape 1 de l'enrôlement : génère un secret et le QR code.
     * Le 2FA n'est PAS encore actif à ce stade — il faut confirmer avec un code.
     */
    public function enable(Request $request)
    {
        $user = $request->user();

        if ($user->hasTwoFactorEnabled()) {
            return response()->json(['message' => 'Two-factor authentication is already enabled.'], 409);
        }

        $secret = $this->twoFactor->generateSecret();

        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        $otpauthUrl = $this->twoFactor->otpauthUrl($user, $secret);

        return response()->json([
            'secret' => $secret,
            'otpauth_url' => $otpauthUrl,
            'qr_code' => $this->twoFactor->qrCodeDataUri($otpauthUrl),
        ], 200);
    }

    /**
     * Étape 2 de l'enrôlement : l'utilisateur prouve que son app est bien synchronisée.
     * C'est seulement ici que le 2FA devient actif, et que les codes de secours sont émis.
     */
    public function confirm(Request $request)
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (is_null($user->two_factor_secret)) {
            return response()->json(['message' => 'No pending two-factor setup. Call /2fa/enable first.'], 409);
        }

        if ($user->hasTwoFactorEnabled()) {
            return response()->json(['message' => 'Two-factor authentication is already enabled.'], 409);
        }

        if (! $this->twoFactor->verifyCode($user->two_factor_secret, $request->input('code'))) {
            throw ValidationException::withMessages([
                'code' => ['The provided two-factor code is invalid.'],
            ]);
        }

        $recoveryCodes = $this->twoFactor->generateRecoveryCodes();

        $user->forceFill([
            'two_factor_recovery_codes' => $recoveryCodes['hashed'],
            'two_factor_confirmed_at' => now(),
        ])->save();

        // Les codes en clair ne sont montrés qu'ici, une seule fois.
        return response()->json([
            'message' => 'Two-factor authentication enabled.',
            'recovery_codes' => $recoveryCodes['plain'],
        ], 200);
    }

    /**
     * Désactive le 2FA. On redemande le mot de passe : sans ça, un token volé suffirait à le couper.
     */
    public function disable(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! Hash::check($request->input('password'), $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The provided password is incorrect.'],
            ]);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return response()->json(['message' => 'Two-factor authentication disabled.'], 200);
    }

    /**
     * Régénère les codes de secours (par exemple si l'utilisateur les a perdus).
     */
    public function regenerateRecoveryCodes(Request $request)
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user();

        if (! $user->hasTwoFactorEnabled()) {
            return response()->json(['message' => 'Two-factor authentication is not enabled.'], 409);
        }

        if (! Hash::check($request->input('password'), $user->password)) {
            throw ValidationException::withMessages([
                'password' => ['The provided password is incorrect.'],
            ]);
        }

        $recoveryCodes = $this->twoFactor->generateRecoveryCodes();

        $user->forceFill([
            'two_factor_recovery_codes' => $recoveryCodes['hashed'],
        ])->save();

        return response()->json(['recovery_codes' => $recoveryCodes['plain']], 200);
    }

    /**
     * Second facteur du login : échange le login_token temporaire (émis par /login)
     * contre un vrai token Sanctum, à condition de fournir un code TOTP ou un code de secours.
     */
    public function challenge(Request $request)
    {
        $request->validate([
            'login_token' => ['required', 'string'],
            'code' => ['required_without:recovery_code', 'nullable', 'string'],
            'recovery_code' => ['required_without:code', 'nullable', 'string'],
        ]);

        $cacheKey = 'two_factor_login:' . hash('sha256', $request->input('login_token'));
        $userId = Cache::get($cacheKey);

        if (! $userId) {
            return response()->json(['message' => 'The login token is invalid or has expired.'], 401);
        }

        $user = User::find($userId);

        if (! $user || ! $user->hasTwoFactorEnabled()) {
            Cache::forget($cacheKey);

            return response()->json(['message' => 'The login token is invalid or has expired.'], 401);
        }

        if ($code = $request->input('code')) {
            $valid = $this->twoFactor->verifyCode($user->two_factor_secret, $code);
        } else {
            $remaining = $this->twoFactor->consumeRecoveryCode(
                $user->two_factor_recovery_codes ?? [],
                $request->input('recovery_code'),
            );

            $valid = ! is_null($remaining);

            if ($valid) {
                // Un code de secours ne sert qu'une fois.
                $user->forceFill(['two_factor_recovery_codes' => $remaining])->save();
            }
        }

        if (! $valid) {
            throw ValidationException::withMessages([
                'code' => ['The provided two-factor code is invalid.'],
            ]);
        }

        // Le login_token est à usage unique : on le brûle dès qu'il a servi.
        Cache::forget($cacheKey);

        return response()->json([
            'message' => 'Login successful',
            'token' => $user->createToken('auth_token')->plainTextToken,
        ], 200);
    }
}
