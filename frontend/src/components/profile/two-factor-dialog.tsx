import { useEffect, useState, type FormEvent } from "react"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { OtpField } from "@/components/otp-field"
import { RecoveryCodes } from "@/components/profile/recovery-codes"
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
import { useAuth } from "@/context/AuthContext"
import { getErrorMessage } from "@/lib/api"
import {
  confirmTwoFactor,
  disableTwoFactor,
  enableTwoFactor,
  regenerateRecoveryCodes,
  type TwoFactorSetup,
} from "@/lib/two-factor"

/**
 * Ce que l'utilisateur a demandé depuis les paramètres :
 * - "setup"    : il a allumé l'interrupteur -> scanner le QR code puis confirmer.
 * - "disable"  : il l'a éteint -> confirmer par mot de passe.
 * - "recovery" : il veut de nouveaux codes de secours -> confirmer par mot de passe.
 */
export type TwoFactorMode = "setup" | "disable" | "recovery"

interface TwoFactorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: TwoFactorMode
}

export function TwoFactorDialog({
  open,
  onOpenChange,
  mode,
}: TwoFactorDialogProps) {
  const { refreshUser } = useAuth()

  const [setup, setSetup] = useState<TwoFactorSetup | null>(null)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)

  useEffect(() => {
    if (!open) return

    setSetup(null)
    setRecoveryCodes([])
    setCode("")
    setPassword("")
    setError("")

    if (mode !== "setup") return

    // On demande le secret + le QR code dès l'ouverture : le 2FA reste inactif
    // tant que l'utilisateur n'a pas confirmé avec un code.
    setIsPreparing(true)
    enableTwoFactor()
      .then(setSetup)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsPreparing(false))
  }, [open, mode])

  async function handleConfirm(value: string) {
    setError("")
    setIsSubmitting(true)

    try {
      setRecoveryCodes(await confirmTwoFactor(value.trim()))
      await refreshUser()
      toast.success("Two-factor authentication enabled")
    } catch (err) {
      setError(getErrorMessage(err))
      setCode("")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDisable(e: FormEvent) {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      await disableTwoFactor(password)
      await refreshUser()
      toast.success("Two-factor authentication disabled")
      onOpenChange(false)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRegenerate(e: FormEvent) {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      setRecoveryCodes(await regenerateRecoveryCodes(password))
      toast.success("New recovery codes generated")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const errorAlert = error ? (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  ) : null

  // Dès que les codes de secours existent, ils passent devant tout le reste :
  // c'est la seule et unique fois qu'ils sont affichés en clair.
  if (recoveryCodes.length > 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save your recovery codes</DialogTitle>
            <DialogDescription>
              Use these if you ever lose access to your authenticator app.
            </DialogDescription>
          </DialogHeader>

          <RecoveryCodes codes={recoveryCodes} />

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>I&apos;ve saved them</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {mode === "setup" && (
          <>
            <DialogHeader>
              <DialogTitle>Scan the QR code</DialogTitle>
              <DialogDescription>
                Open your authenticator app (Google Authenticator, Authy, 1Password…),
                scan this code, then type the 6 digits it shows.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {errorAlert}

              <div className="flex justify-center">
                {isPreparing || !setup ? (
                  <div className="bg-muted size-48 animate-pulse rounded-md" />
                ) : (
                  <img
                    src={setup.qr_code}
                    alt="Two-factor authentication QR code"
                    className="size-48 rounded-md bg-white p-2"
                  />
                )}
              </div>

              {setup && (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-center text-xs">
                    Can&apos;t scan it? Enter this key manually:
                  </p>
                  <p className="bg-muted rounded-md p-2 text-center font-mono text-xs break-all">
                    {setup.secret}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="confirm-code" className="justify-center">
                  Verification code
                </Label>
                <OtpField
                  id="confirm-code"
                  value={code}
                  onChange={setCode}
                  onComplete={handleConfirm}
                  disabled={isSubmitting || !setup}
                />
                <p className="text-muted-foreground text-center text-xs">
                  {isSubmitting
                    ? "Verifying..."
                    : "Two-factor authentication turns on once this code checks out."}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}

        {mode === "disable" && (
          <>
            <DialogHeader>
              <DialogTitle>Turn off two-factor authentication</DialogTitle>
              <DialogDescription>
                Your account will only be protected by your password. Confirm with
                your password to continue.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleDisable} className="space-y-4">
              {errorAlert}

              <div className="space-y-2">
                <Label htmlFor="disable-password">Current password</Label>
                <Input
                  id="disable-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  autoComplete="current-password"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="destructive" disabled={isSubmitting}>
                  {isSubmitting ? "Turning off..." : "Turn off"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {mode === "recovery" && (
          <>
            <DialogHeader>
              <DialogTitle>Generate new recovery codes</DialogTitle>
              <DialogDescription>
                Your current codes will stop working. Confirm with your password to
                continue.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleRegenerate} className="space-y-4">
              {errorAlert}

              <div className="space-y-2">
                <Label htmlFor="regenerate-password">Current password</Label>
                <Input
                  id="regenerate-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  autoComplete="current-password"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Generating..." : "Generate"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
