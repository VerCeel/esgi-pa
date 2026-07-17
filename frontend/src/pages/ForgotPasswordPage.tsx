import { useState, type FormEvent } from "react"
import { Link } from "react-router-dom"
import { AlertCircle, ArrowLeft, MailCheck } from "lucide-react"
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
import { forgotPassword, getErrorMessage } from "@/lib/api"

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      await forgotPassword(email)
      // La réponse est la même que l'email existe ou non : on affiche toujours la
      // confirmation, sans jamais révéler si le compte existe.
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        {sent ? (
          <>
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-full">
                <MailCheck className="size-5" />
              </div>
              <CardTitle>Check your inbox</CardTitle>
              <CardDescription>
                If <span className="font-medium">{email}</span> is registered,
                you&apos;ll receive a link to reset your password shortly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link to="/login">
                  <ArrowLeft className="size-4" />
                  Back to sign in
                </Link>
              </Button>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Forgot your password?</CardTitle>
              <CardDescription>
                Enter your email and we&apos;ll send you a link to reset it.
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
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send reset link"}
                </Button>
              </form>

              <p className="text-muted-foreground mt-6 text-center text-sm">
                Remembered it?{" "}
                <Link
                  to="/login"
                  className="text-primary font-medium hover:underline"
                >
                  Back to sign in
                </Link>
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
