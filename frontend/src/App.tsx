import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { Footer } from "@/components/Footer"
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
import { ForgotPasswordPage } from "@/pages/ForgotPasswordPage"
import { IncomesPage } from "@/pages/IncomesPage"
import { LandingPage } from "@/pages/LandingPage"
import { LoginPage } from "@/pages/LoginPage"
import { OAuthCallbackPage } from "@/pages/OAuthCallbackPage"
import { RegisterPage } from "@/pages/RegisterPage"
import { ResetPasswordPage } from "@/pages/ResetPasswordPage"
import { SharedAccountsPage } from "@/pages/SharedAccountsPage"

function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Retour de la boucle OAuth : ni invité ni protégé — la page ouvre elle-même
            la session à partir du token reçu, puis redirige. */}
        <Route path="/auth/callback" element={<OAuthCallbackPage />} />

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/incomes" element={<IncomesPage />} />
          <Route path="/shared" element={<SharedAccountsPage />} />
          <Route path="/shared/accept/:token" element={<AcceptSharePage />} />
          <Route path="/settings/billing" element={<BillingPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
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
