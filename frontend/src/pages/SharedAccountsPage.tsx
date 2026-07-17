import { useCallback, useEffect, useState } from "react"
import { Eye, LogOut } from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getSharedAccounts,
  leaveSharedAccount,
  type SharedAccount,
} from "@/lib/accounts"
import { getErrorMessage } from "@/lib/api"
import { formatAmount, formatRate } from "@/lib/format"

export function SharedAccountsPage() {
  const [accounts, setAccounts] = useState<SharedAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [leaving, setLeaving] = useState<SharedAccount | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)

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

  async function handleLeave() {
    if (!leaving) return

    setIsLeaving(true)
    try {
      await leaveSharedAccount(leaving.id)
      toast.success(`You left ${leaving.name}`)
      setLeaving(null)
      await fetchAccounts()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLeaving(false)
    }
  }

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
                <div className="flex justify-end pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => setLeaving(account)}
                  >
                    <LogOut className="size-4" />
                    Leave
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog
        open={leaving !== null}
        onOpenChange={(open) => !open && setLeaving(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave shared account</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll lose access to{" "}
              <span className="text-foreground font-medium">
                {leaving?.name}
              </span>
              . The owner can share it with you again later. This doesn&apos;t
              delete any data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLeaving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleLeave()
              }}
              disabled={isLeaving}
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {isLeaving ? "Leaving..." : "Leave"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
