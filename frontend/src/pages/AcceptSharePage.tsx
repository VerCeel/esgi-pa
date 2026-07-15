import { useEffect, useRef, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { AlertCircle, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getErrorMessage } from "@/lib/api"
import { acceptShare } from "@/lib/shares"

/**
 * Cible du lien reçu par email. La route est protégée : un invité non connecté est
 * d'abord renvoyé vers le login, ce qui est voulu — c'est la connexion qui prouve
 * que la personne possède bien l'adresse email visée par l'invitation.
 */
export function AcceptSharePage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [accountName, setAccountName] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  // React 18+ monte les composants deux fois en dev : sans ce garde-fou, l'invitation
  // serait acceptée deux fois de suite.
  const hasRun = useRef(false)

  useEffect(() => {
    if (!token || hasRun.current) return
    hasRun.current = true

    acceptShare(token)
      .then((result) => setAccountName(result.account.name))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false))
  }, [token])

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Shared account invitation</CardTitle>
          <CardDescription>
            {isLoading
              ? "Checking your invitation..."
              : error
                ? "We could not accept this invitation."
                : "The account is now available in your shared list."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <>
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <p className="text-muted-foreground text-sm">
                An invitation is tied to the email address it was sent to. Make sure
                you are signed in with that address.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link to="/dashboard">Back to dashboard</Link>
              </Button>
            </>
          ) : (
            !isLoading && (
              <>
                <Alert>
                  <Check />
                  <AlertDescription>
                    <span className="font-medium">{accountName}</span> was shared
                    with you, in read-only.
                  </AlertDescription>
                </Alert>
                <Button
                  className="w-full"
                  onClick={() => navigate("/shared")}
                >
                  View shared accounts
                </Button>
              </>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
