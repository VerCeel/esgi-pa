import { useState, type FormEvent } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { AlertCircle } from "lucide-react"
import { toast } from "sonner"
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
import { getErrorMessage, resetPassword } from "@/lib/api"

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // Le lien reçu par email porte le token et l'email en query string.
  const token = searchParams.get("token") ?? ""
  const email = searchParams.get("email") ?? ""

  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const linkIsValid = token !== "" && email !== ""

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")

    if (password !== confirmation) {
      setError("The two passwords don't match.")
      return
    }

    setIsSubmitting(true)

    try {
      await resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmation,
      })
      toast.success("Password reset. You can now sign in.")
      navigate("/login")
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            {linkIsValid
              ? `Choose a new password for ${email}.`
              : "This reset link is invalid or incomplete."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkIsValid ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmation">Confirm new password</Label>
                <Input
                  id="confirmation"
                  type="password"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Resetting..." : "Reset password"}
              </Button>
            </form>
          ) : (
            <Button asChild variant="outline" className="w-full">
              <Link to="/forgot-password">Request a new link</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
