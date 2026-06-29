import { Link, useLocation, useNavigate } from "react-router-dom"
import { Bird, LayoutDashboard, LogOut, Wallet } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

const navLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: Wallet },
]

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    await logout()
    navigate("/login")
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            to={isAuthenticated ? "/dashboard" : "/login"}
            className="flex items-center gap-2"
          >
            <Bird className="size-6 text-primary" />
            <span className="text-lg font-semibold tracking-tight">Budgie</span>
          </Link>

          {isAuthenticated && (
            <nav className="hidden items-center gap-1 sm:flex">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Button
                  key={to}
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    location.pathname === to && "bg-accent text-accent-foreground",
                  )}
                >
                  <Link to={to}>
                    <Icon className="size-4" />
                    {label}
                  </Link>
                </Button>
              ))}
            </nav>
          )}
        </div>

        <nav className="flex items-center gap-2">
          <ModeToggle />
          {isAuthenticated ? (
            <>
              <span className="text-muted-foreground hidden text-sm sm:inline">
                {user?.name}
              </span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="size-4" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
