import { useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { CheckCircle2, MailWarning } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getErrorMessage, resendVerificationEmail } from "@/lib/api"

/**
 * Cible du lien de vérification : l'API a traité le clic puis nous a renvoyés ici avec
 * un `?status`. En cas de lien expiré/invalide, on propose d'en redemander un nouveau.
 */
type Status = "success" | "already" | "expired" | "invalid"

const CONTENT: Record<
  Status,
  { title: string; description: string; ok: boolean }
> = {
  success: {
    title: "Email verified",
    description: "Your address is confirmed. You can now sign in.",
    ok: true,
  },
  already: {
    title: "Already verified",
    description: "This email was already verified. You can sign in.",
    ok: true,
  },
  expired: {
    title: "Link expired",
    description:
      "This verification link is no longer valid. Request a new one below.",
    ok: false,
  },
  invalid: {
    title: "Invalid link",
    description:
      "We couldn't verify your email from this link. Request a new one below.",
    ok: false,
  },
}

export function EmailVerifiedPage() {
  const [searchParams] = useSearchParams()
  const status = (searchParams.get("status") ?? "invalid") as Status
  const content = CONTENT[status] ?? CONTENT.invalid

  const [email, setEmail] = useState("")
  const [isResending, setIsResending] = useState(false)

  async function handleResend() {
    if (!email) return
    setIsResending(true)
    try {
      const message = await resendVerificationEmail(email)
      toast.success(message)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div
            className={
              content.ok
                ? "mb-2 flex size-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"
                : "bg-destructive/10 text-destructive mb-2 flex size-10 items-center justify-center rounded-full"
            }
          >
            {content.ok ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <MailWarning className="size-5" />
            )}
          </div>
          <CardTitle>{content.title}</CardTitle>
          <CardDescription>{content.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {content.ok ? (
            <Button asChild className="w-full">
              <Link to="/login">Go to sign in</Link>
            </Button>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleResend}
                disabled={isResending || !email}
              >
                {isResending ? "Sending..." : "Send a new link"}
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/login">Back to sign in</Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
