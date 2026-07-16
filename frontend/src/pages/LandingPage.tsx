import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Coins,
  Receipt,
  Repeat,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react"
import Aurora from "@/components/react-bits/Aurora"
import { BudgieLogo } from "@/components/BudgieLogo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Tone = "cyan" | "pink" | "gold"

/** Halo d'angle de la tuile. */
const glowClasses: Record<Tone, string> = {
  cyan: "from-brand-cyan/20",
  pink: "from-brand-pink/20",
  gold: "from-brand-gold/20",
}

/** Pastille de l'icône. */
const iconClasses: Record<Tone, string> = {
  cyan: "bg-brand-cyan/10 text-brand-cyan",
  pink: "bg-brand-pink/10 text-brand-pink",
  gold: "bg-brand-gold/10 text-brand-gold",
}

interface TileProps {
  tone: Tone
  className?: string
  children: ReactNode
}

/**
 * Une tuile du bento. C'est le gabarit (col-span / row-span) qui crée le rythme de la
 * grille, pas la couleur : la teinte ne fait qu'identifier la famille de fonctionnalité.
 */
function Tile({ tone, className, children }: TileProps) {
  return (
    <div
      className={cn(
        "group bg-card relative overflow-hidden rounded-2xl border p-6",
        "transition-shadow duration-300 hover:shadow-lg",
        className,
      )}
    >
      {/* Décoratif : ne doit jamais intercepter un clic. */}
      <div
        className={cn(
          "pointer-events-none absolute -top-24 -right-24 size-56 rounded-full",
          "bg-gradient-to-br to-transparent opacity-60 blur-2xl",
          "transition-opacity duration-500 group-hover:opacity-100",
          glowClasses[tone],
        )}
      />
      <div className="relative">{children}</div>
    </div>
  )
}

function TileIcon({ icon: Icon, tone }: { icon: typeof Wallet; tone: Tone }) {
  return (
    <div
      className={cn(
        "mb-4 flex size-10 items-center justify-center rounded-xl",
        iconClasses[tone],
      )}
    >
      <Icon className="size-5" />
    </div>
  )
}

export function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      {/* -mt-20 = hauteur de la navbar (h-20) : le hero glisse sous la navbar
          transparente, l'aurora démarre donc au ras du haut de l'écran. */}
      <section className="relative -mt-20 flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 pt-32 pb-20">
        <div className="absolute inset-0 -z-10">
          <Aurora
            colorStops={["#22d3ee", "#ec4899", "#f5b301"]}
            amplitude={1.1}
            blend={0.55}
            className="size-full"
          />
          <div className="from-background/70 via-background/40 to-background absolute inset-0 bg-gradient-to-b" />
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <div className="bg-card/60 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium backdrop-blur">
            <BudgieLogo className="size-4" />
            Personal finance, without the bank
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Know exactly where your money{" "}
            <span className="from-brand-cyan via-brand-pink to-brand-gold bg-gradient-to-r bg-clip-text text-transparent">
              will be
            </span>
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty">
            Budgie replays your finances month by month — every expense, every income,
            every interest payment — so you can see your balance years ahead. No bank
            connection, no third party touching your data.
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
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Everything your money does, in one place
          </h2>
          <p className="text-muted-foreground mt-3 text-pretty">
            Accounts, expenses, incomes and forecasts — plus the details most budgeting
            apps skip.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-6">
          {/* Tuile héroïne : la prévision, le cœur du produit. */}
          <Tile tone="cyan" className="md:col-span-4 md:row-span-2">
            <TileIcon icon={TrendingUp} tone="cyan" />
            <h3 className="text-xl font-semibold">Forecast any month, years ahead</h3>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              Pick a month — December 2035, why not — and Budgie tells you exactly where
              each account lands, down to the cent.
            </p>

            <div className="bg-background/60 mt-6 space-y-2 rounded-xl border p-4 font-mono text-sm backdrop-blur">
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>Account</span>
                <span>31 Dec 2035</span>
              </div>
              <div className="flex justify-between">
                <span>Société Générale</span>
                <span className="text-brand-cyan">€30,570.00</span>
              </div>
              <div className="flex justify-between">
                <span>Livret A</span>
                <span className="text-brand-cyan">€8,214.36</span>
              </div>
              <div className="flex justify-between">
                <span>Compte Titre</span>
                <span className="text-brand-cyan">€1,004.77</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span className="text-brand-gold">€39,789.13</span>
              </div>
            </div>
          </Tile>

          <Tile tone="gold" className="md:col-span-2">
            <TileIcon icon={Coins} tone="gold" />
            <h3 className="font-semibold">Interest, compounded and taxed</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              An annual rate becomes a monthly payment, net of tax, added back to the
              balance — so it earns interest too.
            </p>
          </Tile>

          <Tile tone="pink" className="md:col-span-2">
            <TileIcon icon={Wallet} tone="pink" />
            <h3 className="font-semibold">Every kind of account</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Current, savings, investment — each with its own rate and its own tax.
            </p>
          </Tile>

          <Tile tone="pink" className="md:col-span-2">
            <TileIcon icon={Receipt} tone="pink" />
            <h3 className="font-semibold">Expenses &amp; incomes</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              One-off or every N months. Filter by name or description, instantly.
            </p>
          </Tile>

          <Tile tone="gold" className="md:col-span-2">
            <TileIcon icon={Repeat} tone="gold" />
            <h3 className="font-semibold">Exceptions</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Groceries cost less in August? Override that month without touching the
              others.
            </p>
          </Tile>

          <Tile tone="cyan" className="md:col-span-2">
            <TileIcon icon={Users} tone="cyan" />
            <h3 className="font-semibold">Share, read-only</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Invite someone by email. They see everything, they change nothing.
            </p>
          </Tile>

          <Tile tone="cyan" className="md:col-span-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="bg-brand-cyan/10 text-brand-cyan flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    Your data never leaves your account
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    No bank connection, ever. Two-factor authentication, recovery codes
                    and an encrypted secret — the way it should be.
                  </p>
                </div>
              </div>
              <Button variant="outline" asChild className="shrink-0">
                <Link to="/register">
                  Create your account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Tile>
        </div>
      </section>

      <section className="px-4 pb-24">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border p-10 text-center sm:p-16">
          <div className="from-brand-cyan/15 via-brand-pink/10 to-brand-gold/15 pointer-events-none absolute inset-0 bg-gradient-to-br" />

          <div className="relative">
            <div className="bg-brand-gold/10 text-brand-gold mx-auto mb-6 flex size-12 items-center justify-center rounded-2xl">
              <Sparkles className="size-6" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-balance">
              Start free. Two accounts, no card.
            </h2>
            <p className="text-muted-foreground mx-auto mt-3 max-w-xl text-pretty">
              Upgrade only when you outgrow it — unlimited accounts, expenses and
              incomes.
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link to="/register">
                Create your account
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
