<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    public function show()
    {
        return response()->json($this->formatUser(Auth::user()), 200);
    }

    public function update(Request $request)
    {
        $currentUser = Auth::user();

        $validated = Validator::make($request->all(), [
            'name' => ['nullable', 'string', 'max:255'],
            'password' => ['nullable', 'string'],
            'new_password' => ['required_with:password', 'string', 'min:8'],
            'new_password_confirmation' => ['required_with:new_password', 'same:new_password'],
            'avatar' => ['nullable', 'image', 'max:2048'],
            'remove_avatar' => ['nullable', 'boolean'],
        ]);

        if ($validated->fails()) {
            return response()->json($validated->errors(), 422);
        }

        if (!empty($request['name'])) {
            $currentUser->name = $request['name'];
        }

        if (!empty($request['password'])) {
            if (!Hash::check($request['password'], $currentUser->password)) {
                return response()->json([
                    'password' => ['The current password is incorrect.'],
                ], 422);
            }
            $currentUser->password = Hash::make($request['new_password']);
        }

        if ($request->hasFile('avatar')) {
            if ($currentUser->avatar) {
                Storage::disk('public')->delete($currentUser->avatar);
            }
            $currentUser->avatar = $request->file('avatar')->store('avatars', 'public');
        } elseif ($request->boolean('remove_avatar') && $currentUser->avatar) {
            // Suppression de la photo : on efface le fichier et on revient aux initiales.
            Storage::disk('public')->delete($currentUser->avatar);
            $currentUser->avatar = null;
        }

        $currentUser->save();

        return response()->json($this->formatUser($currentUser->fresh()), 200);
    }

    private function formatUser($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar,
            'avatar_url' => $user->avatar
                ? '/storage/' . $user->avatar
                : null,
            'email_verified_at' => $user->email_verified_at,
            'two_factor_enabled' => $user->hasTwoFactorEnabled(),
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }
}
