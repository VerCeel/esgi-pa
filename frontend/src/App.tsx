import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Navbar } from "@/components/Navbar"
import { GuestRoute, ProtectedRoute } from "@/components/ProtectedRoute"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/context/AuthContext"
import { AcceptSharePage } from "@/pages/AcceptSharePage"
import { AccountsPage } from "@/pages/AccountsPage"
import { BillingPage } from "@/pages/BillingPage"
import { DashboardPage } from "@/pages/DashboardPage"
import { ExpensesPage } from "@/pages/ExpensesPage"
import { IncomesPage } from "@/pages/IncomesPage"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/LoginPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { SharedAccountsPage } from "@/pages/SharedAccountsPage"

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/incomes" element={<IncomesPage />} />
          <Route path="/shared" element={<SharedAccountsPage />} />
          {/* Cible du lien d'invitation reçu par email. Protégée : se connecter est
              justement ce qui prouve qu'on possède l'adresse email invitée. */}
          <Route path="/shared/accept/:token" element={<AcceptSharePage />} />
          <Route path="/settings/billing" element={<BillingPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BrowserRouter>
        <AuthProvider>
          <AppLayout />
          <Toaster richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
