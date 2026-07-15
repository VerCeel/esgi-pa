import { useCallback, useEffect, useState, type FormEvent } from "react"
import { AlertCircle, Clock, Check, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Account } from "@/lib/accounts"
import { getErrorMessage } from "@/lib/api"
import {
  getShares,
  revokeShare,
  shareAccount,
  type AccountShare,
} from "@/lib/shares"

interface ShareAccountDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: Account | null
}

export function ShareAccountDialog({
  open,
  onOpenChange,
  account,
}: ShareAccountDialogProps) {
  const [shares, setShares] = useState<AccountShare[]>([])
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const fetchShares = useCallback(async () => {
    if (!account) return

    setIsLoading(true)
    try {
      setShares(await getShares(account.id))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [account])

  useEffect(() => {
    if (!open) return

    setEmail("")
    setError("")
    fetchShares()
  }, [open, fetchShares])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!account) return

    setError("")
    setIsSubmitting(true)

    try {
      await shareAccount(account.id, email.trim())
      toast.success(`Invitation sent to ${email.trim()}`)
      setEmail("")
      await fetchShares()
    } catch (err) {
      const message = getErrorMessage(err)
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRevoke(share: AccountShare) {
    if (!account) return

    try {
      await revokeShare(account.id, share.id)
      toast.success(`Access revoked for ${share.email}`)
      await fetchShares()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share “{account?.name}”</DialogTitle>
          <DialogDescription>
            The people you invite receive an email link. They will see the account,
            its expenses and its incomes — in read-only. They can never modify
            anything.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="share-email">Email address</Label>
            <div className="flex gap-2">
              <Input
                id="share-email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Invite"}
              </Button>
            </div>
          </div>
        </form>

        <div className="space-y-2">
          <p className="text-sm font-medium">People with access</p>

          {isLoading ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              Loading...
            </p>
          ) : shares.length === 0 ? (
            <p className="text-muted-foreground rounded-md border py-4 text-center text-sm">
              This account is not shared with anyone.
            </p>
          ) : (
            <ul className="space-y-2">
              {shares.map((share) => (
                <li
                  key={share.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{share.email}</p>
                    <p className="text-muted-foreground flex items-center gap-1 text-xs">
                      {share.accepted_at ? (
                        <>
                          <Check className="size-3" />
                          Accepted
                        </>
                      ) : (
                        <>
                          <Clock className="size-3" />
                          Invitation pending
                        </>
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive shrink-0"
                    onClick={() => handleRevoke(share)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Revoke access</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
