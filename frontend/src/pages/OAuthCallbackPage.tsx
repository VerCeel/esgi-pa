import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"

const ERROR_MESSAGES: Record<string, string> = {
  social_failed: "We couldn't sign you in with that provider. Please try again.",
  social_no_email:
    "That provider didn't share an email address, which we need to create your account.",
}

/**
 * Point d'atterrissage de la boucle OAuth : l'API nous a renvoyés ici avec, dans l'URL,
 * soit un `token` à échanger contre une session, soit une `error`.
 */
export function OAuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  // React 18 monte les effets deux fois en dev : sans ce garde, on tenterait
  // d'ouvrir la session deux fois avec le même token.
  const handled = useRef(false)

  useEffect(() => {
    if (handled.current) return
    handled.current = true

    const token = searchParams.get("token")
    const errorCode = searchParams.get("error")

    if (errorCode || !token) {
      setError(
        ERROR_MESSAGES[errorCode ?? ""] ??
          "Something went wrong while signing you in. Please try again.",
      )
      return
    }

    loginWithToken(token)
      .then(() => navigate("/dashboard", { replace: true }))
      .catch(() =>
        setError("We couldn't complete your sign in. Please try again."),
      )
  }, [searchParams, loginWithToken, navigate])

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      {error ? (
        <div className="w-full max-w-md space-y-4">
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link to="/login">Back to sign in</Link>
          </Button>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">Signing you in...</p>
      )}
    </div>
  )
}
