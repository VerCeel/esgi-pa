import { Navigate, Outlet, useLocation } from "react-router-dom"
import { AppNav } from "@/components/AppNav"
import { useAuth } from "@/context/AuthContext"

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    // On mémorise la page visée pour y revenir après connexion. Sans ça, un invité qui
    // clique le lien de partage reçu par email atterrirait sur le dashboard, et son
    // invitation ne serait jamais acceptée.
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // La navigation de l'app est rendue ici plutôt que dans la navbar : chaque page
  // protégée l'affiche en tête de contenu, la navbar reste minimale.
  return (
    <>
      <AppNav />
      <Outlet />
    </>
  )
}

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading...</p>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
