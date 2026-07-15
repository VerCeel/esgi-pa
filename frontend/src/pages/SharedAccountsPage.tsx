import { useCallback, useEffect, useState } from "react"
import { Eye } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getSharedAccounts, type SharedAccount } from "@/lib/accounts"
import { getErrorMessage } from "@/lib/api"
import { formatAmount, formatRate } from "@/lib/format"

export function SharedAccountsPage() {
  const [accounts, setAccounts] = useState<SharedAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true)
    try {
      setAccounts(await getSharedAccounts())
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <PageHeader
        title="Shared with me"
        description="Accounts other people shared with you. You can see everything, but you cannot change anything."
      />

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-md border">
          <p className="text-muted-foreground text-sm">Loading accounts...</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-md border">
          <p className="text-muted-foreground text-sm">
            No one has shared an account with you yet.
          </p>
          <p className="text-muted-foreground text-xs">
            Invitations arrive by email — open the link to accept.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="truncate">{account.name}</CardTitle>
                    <CardDescription className="truncate">
                      {account.description || "No description"}
                    </CardDescription>
                  </div>
                  <span className="text-muted-foreground flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]">
                    <Eye className="size-3" />
                    Read-only
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">Balance</span>
                  <span
                    className={
                      account.balance < 0
                        ? "text-destructive text-lg font-semibold"
                        : "text-brand-cyan text-lg font-semibold"
                    }
                  >
                    {formatAmount(account.balance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remuneration</span>
                  <span>{formatRate(account.remuneration_rate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax rate</span>
                  <span>{formatRate(account.tax_rate)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-muted-foreground">Owner</span>
                  <span className="truncate">{account.owner?.name ?? "—"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
