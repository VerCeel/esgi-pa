import { useCallback, useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Check, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import {
  cancelSubscription,
  getSubscription,
  startCheckout,
  type Subscription,
} from "@/lib/subscription"

function limitLabel(value: number | null): string {
  return value === null ? "Unlimited" : String(value)
}

export function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isWorking, setIsWorking] = useState(false)

  const fetchSubscription = useCallback(async () => {
    setIsLoading(true)
    try {
      setSubscription(await getSubscription())
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])

  // Stripe nous renvoie ici avec ?checkout=success. Ce paramètre ne fait qu'informer :
  // c'est le webhook signé, côté serveur, qui décide réellement du passage en payant.
  useEffect(() => {
    const checkout = searchParams.get("checkout")
    if (!checkout) return

    if (checkout === "success") {
      toast.success("Payment received — your plan is being activated.")
    } else if (checkout === "cancelled") {
      toast.info("Checkout cancelled. Nothing was charged.")
    }

    searchParams.delete("checkout")
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, setSearchParams])

  async function handleUpgrade() {
    setIsWorking(true)
    try {
      window.location.href = await startCheckout()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setIsWorking(false)
    }
  }

  async function handleCancel() {
    setIsWorking(true)
    try {
      setSubscription(await cancelSubscription())
      toast.success("Subscription cancelled. Access lasts until the period ends.")
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsWorking(false)
    }
  }

  const isPremium = subscription?.plan === "PREMIUM"

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <PageHeader
        title="Billing"
        description="Your plan, and what it lets you create."
      />

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-md border">
          <p className="text-muted-foreground text-sm">Loading your plan...</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className={!isPremium ? "border-primary" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Free
                {!isPremium && (
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                    Current
                  </span>
                )}
              </CardTitle>
              <CardDescription>Everything you need to get started.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Check className="size-4" />
                {limitLabel(subscription?.limits.accounts ?? 2)} accounts
              </p>
              <p className="flex items-center gap-2">
                <Check className="size-4" />
                {limitLabel(subscription?.limits.expenses_per_account ?? 7)} expenses
                per account
              </p>
              <p className="flex items-center gap-2">
                <Check className="size-4" />
                {limitLabel(subscription?.limits.incomes_per_account ?? 2)} incomes
                per account
              </p>
              {!isPremium && (
                <p className="text-muted-foreground pt-2 text-xs">
                  You are using {subscription?.usage.accounts} of{" "}
                  {subscription?.limits.accounts} accounts.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className={isPremium ? "border-primary" : undefined}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Sparkles className="size-4" />
                  Premium
                </span>
                {isPremium && (
                  <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                    Current
                  </span>
                )}
              </CardTitle>
              <CardDescription>No limits, ever.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="flex items-center gap-2">
                <Check className="size-4" />
                Unlimited accounts
              </p>
              <p className="flex items-center gap-2">
                <Check className="size-4" />
                Unlimited expenses
              </p>
              <p className="flex items-center gap-2">
                <Check className="size-4" />
                Unlimited incomes
              </p>
              {isPremium && subscription?.plan_ends_at && (
                <p className="text-muted-foreground pt-2 text-xs">
                  Cancelled — your access lasts until{" "}
                  {formatDate(subscription.plan_ends_at)}.
                </p>
              )}

              <div className="pt-2">
                {isPremium ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleCancel}
                    disabled={isWorking || !!subscription?.plan_ends_at}
                  >
                    {subscription?.plan_ends_at
                      ? "Cancellation scheduled"
                      : isWorking
                        ? "Cancelling..."
                        : "Cancel subscription"}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={handleUpgrade}
                    disabled={isWorking}
                  >
                    {isWorking ? "Redirecting to Stripe..." : "Upgrade"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
