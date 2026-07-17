import { useState, type FormEvent } from "react"
import { Link, useLocation } from "react-router-dom"
import { AlertCircle, MailCheck } from "lucide-react"
import { toast } from "sonner"
import { SocialLoginButtons } from "@/components/SocialLoginButtons"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { useAuth } from "@/context/AuthContext"
import {
  getErrorMessage,
  getFieldErrors,
  resendVerificationEmail,
} from "@/lib/api"

export function RegisterPage() {
  const { register } = useAuth()
  const location = useLocation()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Une fois le compte créé, on n'ouvre pas de session : on affiche l'écran
  // « vérifie ta boîte mail » avec le message renvoyé par l'API.
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      const message = await register(name, email, password)
      setConfirmation(message)
    } catch (err) {
      const errors = getFieldErrors(err)
      if (Object.keys(errors).length > 0) {
        const mapped: Record<string, string> = {}
        for (const [field, messages] of Object.entries(errors)) {
          mapped[field] = messages[0]
        }
        setFieldErrors(mapped)
      } else {
        setError(getErrorMessage(err))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleResend() {
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

  if (confirmation) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-full">
              <MailCheck className="size-5" />
            </div>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>{confirmation}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground text-sm">
              We sent a verification link to{" "}
              <span className="text-foreground font-medium">{email}</span>. Click
              it to activate your account, then sign in.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? "Sending..." : "Resend verification email"}
            </Button>
            <Button asChild className="w-full">
              <Link to="/login" state={location.state}>
                Back to sign in
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Join Budgie and start managing your finances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                aria-invalid={!!fieldErrors.name}
              />
              {fieldErrors.name && (
                <p className="text-destructive text-sm">{fieldErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <p className="text-destructive text-sm">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password ? (
                <p className="text-destructive text-sm">{fieldErrors.password}</p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Must be at least 8 characters.
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="mt-6">
            <SocialLoginButtons />
          </div>

          <p className="text-muted-foreground mt-6 text-center text-sm">
            Already have an account?{" "}
            <Link
              to="/login"
              state={location.state}
              className="text-primary font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
