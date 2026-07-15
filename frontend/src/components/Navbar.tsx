import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Receipt,
  Settings,
  Users,
  Wallet,
} from "lucide-react"
import { BudgieLogo } from "@/components/BudgieLogo"
import { ProfileEditDialog } from "@/components/profile/profile-edit-dialog"
import {
  TwoFactorDialog,
  type TwoFactorMode,
} from "@/components/profile/two-factor-dialog"
import { ThemeToggleInline } from "@/components/theme-toggle-inline"
import { UserAvatar } from "@/components/UserAvatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

const appNavLinks = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/accounts", label: "Accounts", icon: Wallet },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/incomes", label: "Incomes", icon: PiggyBank },
]

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isLanding = location.pathname === "/"
  const [profileOpen, setProfileOpen] = useState(false)
  const [twoFactorOpen, setTwoFactorOpen] = useState(false)
  const [twoFactorMode, setTwoFactorMode] = useState<TwoFactorMode>("setup")

  async function handleLogout() {
    await logout()
    navigate("/")
  }

  // Les deux dialogs sont frères : on ferme les paramètres avant d'ouvrir celui du 2FA,
  // plutôt que d'empiler deux modales l'une sur l'autre.
  function handleManageTwoFactor(mode: TwoFactorMode) {
    setProfileOpen(false)
    setTwoFactorMode(mode)
    setTwoFactorOpen(true)
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              to={"/"}
              className="flex items-center gap-2"
            >
              <BudgieLogo className="size-6" />
              <span className="text-lg font-semibold tracking-tight">Budgie</span>
            </Link>

            {isAuthenticated ? (
              <nav className="flex items-center gap-1">
                {appNavLinks.map(({ to, label, icon: Icon }) => (
                  <Button
                    key={to}
                    variant="ghost"
                    size="sm"
                    asChild
                    className={cn(
                      location.pathname === to &&
                        "bg-accent text-accent-foreground",
                    )}
                  >
                    <Link to={to}>
                      <Icon className="size-4" />
                      <span className="hidden sm:inline">{label}</span>
                    </Link>
                  </Button>
                ))}
              </nav>
            ) : isLanding ? (
              <nav className="hidden items-center gap-1 sm:flex">
                <Button variant="ghost" size="sm" asChild>
                  <a href="#features">Features</a>
                </Button>
              </nav>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative size-9 rounded-full p-0"
                  >
                    <UserAvatar user={user} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {user?.email}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={(e) => {
                      e.preventDefault()
                      setProfileOpen(true)
                    }}
                  >
                    <Settings className="size-4" />
                    Edit profile
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/shared">
                      <Users className="size-4" />
                      Shared with me
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings/billing">
                      <CreditCard className="size-4" />
                      Billing
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="size-4" />
                    Log out
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <ThemeToggleInline />
                </DropdownMenuContent>
              </DropdownMenu>
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
          </div>
        </div>
      </header>

      <ProfileEditDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        onManageTwoFactor={handleManageTwoFactor}
      />
      <TwoFactorDialog
        open={twoFactorOpen}
        onOpenChange={setTwoFactorOpen}
        mode={twoFactorMode}
      />
    </>
  )
}
