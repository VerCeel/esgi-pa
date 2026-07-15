import api from "@/lib/api"

export interface Subscription {
  plan: "FREE" | "PREMIUM"
  /** Fin de la période payée, si l'abonnement a été résilié. */
  plan_ends_at: string | null
  limits: {
    /** null = illimité (plan payant). */
    accounts: number | null
    expenses_per_account: number | null
    incomes_per_account: number | null
  }
  usage: {
    accounts: number
  }
}

export async function getSubscription(): Promise<Subscription> {
  const { data } = await api.get<Subscription>("/subscription")
  return data
}

/** Ouvre une session Stripe Checkout : le serveur rend l'URL vers laquelle rediriger. */
export async function startCheckout(): Promise<string> {
  const { data } = await api.post<{ checkout_url: string }>(
    "/subscription/checkout",
  )
  return data.checkout_url
}

export async function cancelSubscription(): Promise<Subscription> {
  const { data } = await api.post<Subscription>("/subscription/cancel")
  return data
}
