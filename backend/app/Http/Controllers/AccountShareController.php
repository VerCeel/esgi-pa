<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ResolvesAccounts;
use App\Models\AccountShare;
use App\Notifications\AccountShareInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

/**
 * Partage d'un compte en lecture seule, par invitation email.
 *
 * Le destinataire n'a pas besoin d'avoir déjà un compte Budgie : l'invitation vise une
 * adresse email, et n'est rattachée à un utilisateur qu'au moment où il l'accepte.
 */
class AccountShareController extends Controller
{
    use ResolvesAccounts;

    /** Les invitations émises sur un compte, vues par son propriétaire. */
    public function index(int $accountId)
    {
        $account = $this->ownedAccount(Auth::user(), $accountId);

        if (! $account) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        return response()->json($account->shares()->with('user:id,name,email')->get(), 200);
    }

    public function store(Request $request, int $accountId)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
        ]);

        $account = $this->ownedAccount($user, $accountId);

        if (! $account) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        if (strcasecmp($validated['email'], $user->email) === 0) {
            return response()->json(['message' => 'You already own this account.'], 422);
        }

        if ($account->shares()->where('email', $validated['email'])->exists()) {
            return response()->json(['message' => 'This account is already shared with that email.'], 422);
        }

        $share = $account->shares()->create([
            'email' => $validated['email'],
            'token' => Str::random(64),
        ]);

        // Notification "on-demand" : le destinataire n'est pas forcément un utilisateur connu.
        Notification::route('mail', $validated['email'])
            ->notify(new AccountShareInvitation($share));

        return response()->json($share, 201);
    }

    /** Le propriétaire retire un partage : l'invité perd immédiatement l'accès. */
    public function destroy(int $accountId, int $shareId)
    {
        $account = $this->ownedAccount(Auth::user(), $accountId);

        if (! $account) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        $share = $account->shares()->whereKey($shareId)->first();

        if (! $share) {
            return response()->json(['message' => 'Share not found'], 404);
        }

        $share->delete();

        return response()->json(['message' => 'Share revoked successfully'], 200);
    }

    /**
     * L'invité accepte l'invitation depuis le lien reçu par email.
     * On exige qu'il soit connecté : c'est ce qui rattache le partage à un utilisateur réel.
     */
    public function accept(string $token)
    {
        $user = Auth::user();
        $share = AccountShare::where('token', $token)->first();

        if (! $share) {
            return response()->json(['message' => 'This invitation is invalid.'], 404);
        }

        // L'invitation vise une adresse précise : impossible de l'utiliser depuis un autre compte,
        // même si le lien fuite.
        if (strcasecmp($share->email, $user->email) !== 0) {
            return response()->json([
                'message' => 'This invitation was sent to a different email address.',
            ], 403);
        }

        $share->update([
            'user_id' => $user->id,
            'accepted_at' => now(),
        ]);

        return response()->json([
            'message' => 'Account shared successfully.',
            'account' => $share->account->only(['id', 'name', 'description']),
        ], 200);
    }
}
