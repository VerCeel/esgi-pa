<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\PlanLimits;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\SignatureVerificationException;
use Stripe\StripeClient;
use Stripe\Webhook;
use UnexpectedValueException;

/**
 * Abonnement via Stripe Checkout.
 *
 * On ne fait jamais confiance au retour du navigateur pour activer le plan payant :
 * un utilisateur pourrait tout simplement visiter l'URL de succès sans avoir payé.
 * Seul le webhook, signé par Stripe, fait passer un compte en PREMIUM.
 */
class SubscriptionController extends Controller
{
    public function __construct(private PlanLimits $planLimits) {}

    /** Le plan courant, ses limites, et où en est l'utilisateur. */
    public function show()
    {
        return response()->json($this->planLimits->summary(Auth::user()), 200);
    }

    /** Ouvre une session Stripe Checkout et rend l'URL vers laquelle rediriger. */
    public function checkout()
    {
        $user = Auth::user();

        if ($user->isPremium()) {
            return response()->json(['message' => 'You are already subscribed.'], 409);
        }

        $stripe = $this->stripe();

        if (! $stripe) {
            return response()->json(['message' => 'Stripe is not configured on this server.'], 503);
        }

        $frontend = rtrim(config('app.frontend_url'), '/');

        $session = $stripe->checkout->sessions->create([
            'mode' => 'subscription',
            'customer_email' => $user->email,
            'line_items' => [[
                'price' => config('services.stripe.price'),
                'quantity' => 1,
            ]],
            // On retrouvera l'utilisateur dans le webhook grâce à cette référence.
            'client_reference_id' => (string) $user->id,
            'success_url' => $frontend . '/settings/billing?checkout=success',
            'cancel_url' => $frontend . '/settings/billing?checkout=cancelled',
        ]);

        return response()->json(['checkout_url' => $session->url], 200);
    }

    /**
     * Résiliation : l'abonnement court jusqu'à la fin de la période déjà payée.
     * Stripe nous préviendra par webhook le moment venu.
     */
    public function cancel()
    {
        $user = Auth::user();
        $stripe = $this->stripe();

        if (! $stripe || ! $user->stripe_subscription_id) {
            return response()->json(['message' => 'You have no active subscription.'], 409);
        }

        $subscription = $stripe->subscriptions->update($user->stripe_subscription_id, [
            'cancel_at_period_end' => true,
        ]);

        // Selon la version de l'API Stripe, la fin de période est portée par l'abonnement
        // ou par ses items : on lit les deux plutôt que de planter sur une propriété absente.
        $periodEnd = $subscription->current_period_end
            ?? $subscription->items->data[0]->current_period_end
            ?? null;

        $user->forceFill([
            'plan_ends_at' => $periodEnd ? CarbonImmutable::createFromTimestamp($periodEnd) : null,
        ])->save();

        return response()->json([
            'message' => 'Your subscription will end at the end of the current period.',
            ...$this->planLimits->summary($user->fresh()),
        ], 200);
    }

    /**
     * Webhook Stripe : la seule source de vérité pour l'état de l'abonnement.
     * Route publique, mais chaque requête doit porter une signature valide.
     */
    public function webhook(Request $request)
    {
        $secret = config('services.stripe.webhook_secret');

        if (! $secret) {
            return response()->json(['message' => 'Stripe webhook is not configured.'], 503);
        }

        try {
            $event = Webhook::constructEvent(
                $request->getContent(),
                $request->header('Stripe-Signature', ''),
                $secret,
            );
        } catch (UnexpectedValueException|SignatureVerificationException $exception) {
            // Signature absente ou invalide : la requête ne vient pas de Stripe.
            Log::warning('Rejected Stripe webhook: ' . $exception->getMessage());

            return response()->json(['message' => 'Invalid signature'], 400);
        }

        match ($event->type) {
            'checkout.session.completed' => $this->activateSubscription($event->data->object),
            'customer.subscription.deleted' => $this->endSubscription($event->data->object),
            default => null,
        };

        return response()->noContent();
    }

    /** Paiement confirmé : le compte passe en PREMIUM. */
    private function activateSubscription(object $session): void
    {
        $user = User::find($session->client_reference_id);

        if (! $user) {
            Log::warning('Stripe checkout completed for an unknown user', [
                'client_reference_id' => $session->client_reference_id,
            ]);

            return;
        }

        $user->forceFill([
            'plan' => 'PREMIUM',
            'stripe_customer_id' => $session->customer,
            'stripe_subscription_id' => $session->subscription,
            'plan_ends_at' => null,
        ])->save();
    }

    /** Fin réelle de l'abonnement : retour au plan gratuit et à ses limites. */
    private function endSubscription(object $subscription): void
    {
        $user = User::where('stripe_subscription_id', $subscription->id)->first();

        $user?->forceFill([
            'plan' => 'FREE',
            'stripe_subscription_id' => null,
            'plan_ends_at' => null,
        ])->save();
    }

    /** Null tant que la clé secrète n'est pas renseignée dans le .env. */
    private function stripe(): ?StripeClient
    {
        $secret = config('services.stripe.secret');

        return $secret ? new StripeClient($secret) : null;
    }
}
