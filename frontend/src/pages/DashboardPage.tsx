import { CalendarDays, Mail, User } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/context/AuthContext"

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {user?.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Your Budgie dashboard — manage your account at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <User className="size-4" />
              Full name
            </CardDescription>
            <CardTitle className="text-lg">{user?.name}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Mail className="size-4" />
              Email address
            </CardDescription>
            <CardTitle className="text-lg font-normal">{user?.email}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CalendarDays className="size-4" />
              Member since
            </CardDescription>
            <CardTitle className="text-lg font-normal">
              {user?.created_at ? formatDate(user.created_at) : "—"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            You&apos;re all set. This is your home base in Budgie.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your account is active and connected to the API. Use the navigation
            bar to sign out when you&apos;re done. More features can be added here
            as your project grows.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
