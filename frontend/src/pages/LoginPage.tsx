import { useState, type FormEvent } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react"
import { OtpField } from "@/components/otp-field"
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
import { getErrorMessage } from "@/lib/api"

interface RedirectState {
  from?: { pathname: string }
}

export function LoginPage() {
  const { login, completeTwoFactorLogin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Là où l'utilisateur voulait aller avant d'être renvoyé ici (un lien de partage, par exemple).
  const redirectTo =
    (location.state as RedirectState | null)?.from?.pathname ?? "/dashboard"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Une fois le mot de passe validé, on garde le login_token le temps du second facteur.
  const [loginToken, setLoginToken] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [useRecoveryCode, setUseRecoveryCode] = useState(false)

  async function handleCredentialsSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const result = await login(email, password)

      if (result.twoFactorRequired) {
        setLoginToken(result.loginToken)
        return
      }

      navigate(redirectTo)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitChallenge(value: string) {
    if (!loginToken || isSubmitting) return

    setError("")
    setIsSubmitting(true)

    try {
      await completeTwoFactorLogin({
        login_token: loginToken,
        ...(useRecoveryCode
          ? { recovery_code: value.trim() }
          : { code: value.trim() }),
      })
      navigate(redirectTo)
    } catch (err) {
      setError(getErrorMessage(err))
      setCode("")
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleChallengeSubmit(e: FormEvent) {
    e.preventDefault()
    submitChallenge(code)
  }

  function backToCredentials() {
    setLoginToken(null)
    setCode("")
    setUseRecoveryCode(false)
    setError("")
    setPassword("")
  }

  function switchCodeMode() {
    setUseRecoveryCode((previous) => !previous)
    setCode("")
    setError("")
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        {loginToken ? (
          <>
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-full">
                <ShieldCheck className="size-5" />
              </div>
              <CardTitle>Two-factor authentication</CardTitle>
              <CardDescription>
                {useRecoveryCode
                  ? "Enter one of the recovery codes you saved when you turned on two-factor authentication."
                  : "Enter the 6-digit code from your authenticator app."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChallengeSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label
                    htmlFor="code"
                    className={useRecoveryCode ? undefined : "justify-center"}
                  >
                    {useRecoveryCode ? "Recovery code" : "Authentication code"}
                  </Label>
                  {useRecoveryCode ? (
                    <Input
                      id="code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      required
                      autoFocus
                      autoComplete="off"
                      placeholder="abcde-fghij"
                    />
                  ) : (
                    <OtpField
                      id="code"
                      value={code}
                      onChange={setCode}
                      onComplete={submitChallenge}
                      disabled={isSubmitting}
                      autoFocus
                    />
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Verifying..." : "Verify"}
                </Button>

                <div className="flex flex-col items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={switchCodeMode}
                    className="text-muted-foreground hover:text-foreground text-sm hover:underline"
                  >
                    {useRecoveryCode
                      ? "Use your authenticator app instead"
                      : "Lost your device? Use a recovery code"}
                  </button>
                  <button
                    type="button"
                    onClick={backToCredentials}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm hover:underline"
                  >
                    <ArrowLeft className="size-3" />
                    Back to sign in
                  </button>
                </div>
              </form>
            </CardContent>
          </>
        ) : (
          <>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>
                Sign in to your Budgie account to continue.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      to="/forgot-password"
                      className="text-muted-foreground hover:text-foreground text-sm hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <div className="mt-6">
                <SocialLoginButtons />
              </div>

              <p className="text-muted-foreground mt-6 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link
                  to="/register"
                  state={location.state}
                  className="text-primary font-medium hover:underline"
                >
                  Register
                </Link>
              </p>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}
