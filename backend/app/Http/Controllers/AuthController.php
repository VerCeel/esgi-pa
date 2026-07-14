<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
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

        return response()->json($user, 201);
    }

    public function login(Request $request)
    {
        $user = User::where('email', $request->email)->first();

        // Hash::check même sans utilisateur trouvé serait idéal contre le timing attack,
        // mais on reste sur un message d'erreur unique pour ne pas révéler si l'email existe.
        if (!$user || !Hash::check((string) $request->input('password'), $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
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
}
