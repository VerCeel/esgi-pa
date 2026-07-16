import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  PiggyBank,
  Receipt,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const appNavLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/incomes", label: "Incomes", icon: PiggyBank },
]

/**
 * Navigation principale de l'app, affichée en tête de chaque page protégée
 * (rendue par ProtectedRoute) — la navbar, elle, ne porte plus que le compte.
 */
export function AppNav() {
  const location = useLocation()

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-6">
      <nav className="flex w-fit items-center gap-1 rounded-full border bg-card p-1 shadow-sm">
        {appNavLinks.map(({ to, label, icon: Icon }) => (
          <Button
            key={to}
            variant="ghost"
            size="sm"
            asChild
            className={cn(
              "rounded-full",
              location.pathname === to && "bg-accent text-accent-foreground",
            )}
          >
            <Link to={to}>
              <Icon className="size-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          </Button>
        ))}
      </nav>
    </div>
  )
}
