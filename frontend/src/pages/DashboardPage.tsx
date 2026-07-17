import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Coins,
  Plus,
  Receipt,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { StatTile } from "@/components/stat-tile"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/context/AuthContext"
import { getAccounts, type Account } from "@/lib/accounts"
import { getErrorMessage } from "@/lib/api"
import { getForecast, type Forecast } from "@/lib/forecast"
import { formatAmount, formatDate, formatRate } from "@/lib/format"

/** Le même jour, un an plus tard — au format "YYYY-MM-DD" attendu par le DatePicker. */
function inOneYear(): string {
  const date = new Date()
  date.setFullYear(date.getFullYear() + 1)
  return date.toISOString().slice(0, 10)
}

export function DashboardPage() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [forecast, setForecast] = useState<Forecast | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // La date projetée, pilotée par le sélecteur. Seul le mois compte pour l'API,
  // qu'on en dérive : la prévision porte sur la fin du mois choisi.
  const [date, setDate] = useState(inOneYear)
  const [isForecasting, setIsForecasting] = useState(false)
  const month = date.slice(0, 7)

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true)
    try {
      setAccounts(await getAccounts())
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  // La prévision se recalcule automatiquement dès qu'on choisit une date — plus de
  // bouton « Compute ». Le drapeau `cancelled` évite qu'une réponse en retard écrase
  // une sélection plus récente.
  useEffect(() => {
    if (!month) return

    let cancelled = false
    setIsForecasting(true)
    getForecast(month)
      .then((data) => !cancelled && setForecast(data))
      .catch((err) => !cancelled && toast.error(getErrorMessage(err)))
      .finally(() => !cancelled && setIsForecasting(false))

    return () => {
      cancelled = true
    }
  }, [month])

  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.balance),
    0,
  )
  const projected = forecast?.total_balance ?? 0
  const interest = forecast?.total_interest ?? 0

  // Les comptes les mieux garnis d'abord : c'est ce qu'on veut voir en premier.
  const topAccounts = [...accounts]
    .sort((a, b) => Number(b.balance) - Number(a.balance))
    .slice(0, 4)

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? "there"}`}
        description="Where your money stands today, and where it's heading."
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-[7.5rem] rounded-2xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile
              label="Total balance today"
              value={formatAmount(totalBalance)}
              hint={`Across ${accounts.length} account(s)`}
              icon={Wallet}
              tone="cyan"
              muted={totalBalance < 0}
            />
            <StatTile
              label={
                forecast
                  ? `Projected on ${formatDate(forecast.as_of)}`
                  : "Projected balance"
              }
              value={formatAmount(projected)}
              hint="Every expense and income included"
              icon={TrendingUp}
              tone="gold"
              muted={projected < 0}
            />
            <StatTile
              label="Interest by then"
              value={formatAmount(interest)}
              hint="Net of tax, compounded monthly"
              icon={Coins}
              tone="pink"
            />
          </div>

          {/* Prévisions : le sélecteur de mois et le détail par compte, autrefois sur
              une page dédiée, vivent maintenant ici. */}
          <div className="bg-card mt-4 rounded-2xl border p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-semibold">Forecast</h2>
                <p className="text-muted-foreground mt-1 text-sm text-pretty">
                  Where each account lands at the end of a month — expenses, incomes,
                  exceptions and net interest included.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="forecast-date">Up to the end of</Label>
                <div className="flex items-center gap-2">
                  <div className="w-[13rem]">
                    <DatePicker
                      id="forecast-date"
                      value={date}
                      onChange={setDate}
                      disabled={isForecasting}
                    />
                  </div>
                  {isForecasting && (
                    <span className="text-muted-foreground flex items-center gap-1 text-sm">
                      <TrendingUp className="size-4 animate-pulse" />
                      Computing…
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Tax</TableHead>
                    <TableHead className="text-right">Incomes</TableHead>
                    <TableHead className="text-right">Expenses</TableHead>
                    <TableHead className="text-right">Net interest</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forecast && forecast.accounts.length ? (
                    forecast.accounts.map((line) => (
                      <TableRow key={line.account_id}>
                        <TableCell className="font-medium">
                          {line.account_name}
                        </TableCell>
                        <TableCell>{formatRate(line.remuneration_rate)}</TableCell>
                        <TableCell>{formatRate(line.tax_rate)}</TableCell>
                        <TableCell className="text-brand-cyan text-right">
                          {formatAmount(line.total_income)}
                        </TableCell>
                        <TableCell className="text-brand-pink text-right">
                          {formatAmount(line.total_expense)}
                        </TableCell>
                        <TableCell className="text-brand-gold text-right">
                          {formatAmount(line.total_interest)}
                        </TableCell>
                        <TableCell
                          className={
                            line.balance < 0
                              ? "text-destructive text-right font-medium"
                              : "text-right font-medium"
                          }
                        >
                          {formatAmount(line.balance)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No account to project yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-6">
            <div className="bg-card rounded-2xl border p-6 md:col-span-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-semibold">Your accounts</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/accounts">
                    See all
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>

              {topAccounts.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed py-10 text-center">
                  <p className="text-muted-foreground text-sm">
                    No account yet. Create one to start forecasting.
                  </p>
                  <Button size="sm" asChild>
                    <Link to="/accounts">
                      <Plus className="size-4" />
                      New account
                    </Link>
                  </Button>
                </div>
              ) : (
                <ul className="divide-y">
                  {topAccounts.map((account) => (
                    <li
                      key={account.id}
                      className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {account.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {Number(account.remuneration_rate) > 0
                            ? `${formatRate(account.remuneration_rate)} · taxed ${formatRate(account.tax_rate)}`
                            : "Not remunerated"}
                        </p>
                      </div>
                      <span
                        className={
                          Number(account.balance) < 0
                            ? "text-destructive shrink-0 font-medium tabular-nums"
                            : "text-brand-cyan shrink-0 font-medium tabular-nums"
                        }
                      >
                        {formatAmount(account.balance)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-card flex flex-col gap-3 rounded-2xl border p-6 md:col-span-2">
              <h2 className="font-semibold">Quick actions</h2>

              <Button variant="outline" className="justify-start" asChild>
                <Link to="/expenses">
                  <Receipt className="size-4" />
                  Add an expense
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/incomes">
                  <Coins className="size-4" />
                  Add an income
                </Link>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <Link to="/accounts">
                  <Wallet className="size-4" />
                  New account
                </Link>
              </Button>

              <div className="mt-auto border-t pt-3">
                <Link
                  to="/settings/billing"
                  className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-xs"
                >
                  <Sparkles className="size-3" />
                  Need more than 2 accounts?
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
