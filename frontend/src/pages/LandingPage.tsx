import { Link } from "react-router-dom"
import {
  ArrowRight,
  BarChart3,
  Bird,
  Receipt,
  TrendingUp,
  UserCircle,
  Wallet,
} from "lucide-react"
import Aurora from "@/components/react-bits/Aurora"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const features = [
  {
    icon: Wallet,
    title: "Manage bank accounts",
    description:
      "Connect and organize all your accounts in one place. Track balances and keep everything under control.",
  },
  {
    icon: TrendingUp,
    title: "Revenue tracking",
    description:
      "Monitor your income streams over time and understand where your money comes from.",
  },
  {
    icon: BarChart3,
    title: "Profits overview",
    description:
      "See your net gains at a glance with clear profit insights that help you make smarter decisions.",
  },
  {
    icon: Receipt,
    title: "Expense management",
    description:
      "Categorize and follow every expense so you always know where your budget goes.",
  },
  {
    icon: UserCircle,
    title: "Profile & settings",
    description:
      "Personalize your experience and manage your account preferences from a single profile hub.",
  },
]

export function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 py-20">
        <div className="absolute inset-0 -z-10">
          <Aurora
            colorStops={["#15803d", "#4ade80", "#166534"]}
            amplitude={1.1}
            blend={0.55}
            className="size-full"
          />
          <div className="from-background/80 via-background/40 absolute inset-0 bg-gradient-to-b to-background" />
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <div className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
            <Bird className="size-4" />
            Personal finance, simplified
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Take control of your money with{" "}
            <span className="text-primary">Budgie</span>
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
            The all-in-one app to manage accounts, track revenue, monitor profits,
            and stay on top of your expenses — all from one beautiful dashboard.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link to="/register">
                Get started free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-5xl px-4 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight">
            Why choose Budgie?
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-2xl">
            Everything you need to manage your personal finances, built into one
            simple and powerful platform.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
                  <Icon className="size-5" />
                </div>
                <CardTitle className="text-lg">{title}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t bg-muted/30 px-4 py-16">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mt-3">
            Create your free account today and start managing your finances with
            Budgie.
          </p>
          <Button size="lg" className="mt-6" asChild>
            <Link to="/register">
              Create your account
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
