import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { CreditCard, LogOut, Settings, Users } from "lucide-react"
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

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // En haut de page la navbar est invisible (l'aurora passe derrière) ;
  // dès qu'on scrolle, le fond « verre » apparaît pour garder le texte lisible.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
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
      {/* La navbar ne porte plus aucune navigation — les liens de l'app vivent
          dans les pages (AppNav), seuls restent le logo et le compte. */}
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-300",
          scrolled
            ? "border-border/40 bg-background/40 backdrop-blur-xl backdrop-saturate-150"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="mx-auto flex h-20 w-full max-w-5xl items-center justify-between px-4">
          <Link
            to={"/"}
            className="flex items-center gap-2"
          >
            <BudgieLogo className="size-9" />
            <span className="text-2xl font-semibold tracking-tight">Budgie</span>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative size-11 rounded-full p-0"
                  >
                    <UserAvatar user={user} className="size-11" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex items-center gap-3 py-1">
                      <UserAvatar user={user} className="size-10" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {user?.name}
                        </p>
                        <p className="text-muted-foreground truncate text-xs">
                          {user?.email}
                        </p>
                      </div>
                    </div>
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
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="size-4" />
                    Log out
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <ThemeToggleInline />
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button variant="ghost" size="lg" className="text-base" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button size="lg" className="text-base" asChild>
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
