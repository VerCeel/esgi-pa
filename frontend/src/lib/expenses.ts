import api from "@/lib/api"
import type { Account } from "@/lib/accounts"

export type FrequencyType = "ONCE" | "RECURRING"

export interface Expense {
  id: number
  name: string
  description: string | null
  amount: string | number
  frequency_type: FrequencyType
  frequency_months: number | null
  start_date_time: string | null
  end_date_time: string | null
  account_id: number
  created_at: string
  updated_at: string
}

export interface ExpenseWithAccount extends Expense {
  account_name: string
}

export interface ExpenseInput {
  name: string
  description?: string
  amount: number
  frequency_type: FrequencyType
  frequency_months?: number | null
  start_date_time: string
  end_date_time?: string | null
  account_id: number
}

interface AccountWithExpenses extends Account {
  expenses: Expense[]
}

export async function getExpenses(): Promise<ExpenseWithAccount[]> {
  const { data } = await api.get<AccountWithExpenses[]>("/expenses")
  return data.flatMap((account) =>
    account.expenses.map((expense) => ({
      ...expense,
      account_name: account.name,
    })),
  )
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const { data } = await api.post<Expense>("/expenses", {
    ...input,
    description: input.description ?? "",
    frequency_months:
      input.frequency_type === "RECURRING" ? input.frequency_months : null,
    end_date_time: input.end_date_time || null,
  })
  return data
}

export async function updateExpense(
  id: number,
  input: Partial<ExpenseInput>,
): Promise<Expense> {
  const { data } = await api.put<Expense>(`/expenses/${id}`, input)
  return data
}

export async function deleteExpense(id: number): Promise<void> {
  await api.delete(`/expenses/${id}`)
}

export function formatAmount(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(num)) return "—"
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
  }).format(num)
}

export function formatFrequency(expense: Expense): string {
  if (expense.frequency_type === "ONCE") return "Once"
  if (expense.frequency_months) {
    return `Every ${expense.frequency_months} month(s)`
  }
  return "Recurring"
}

export function toApiDateTime(value: string): string {
  if (!value) return ""
  const normalized = value.replace("T", " ")
  return normalized.length === 16 ? `${normalized}:00` : normalized
}

export function toInputDateTime(value: string | null | undefined): string {
  if (!value) return ""
  return value.replace(" ", "T").slice(0, 16)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  return new Date(value.replace(" ", "T")).toLocaleString()
}
