import api from "@/lib/api"
import type { Account } from "@/lib/accounts"
import type { FrequencyType } from "@/lib/format"

// Les formatteurs sont désormais partagés avec les revenus, mais on les ré-exporte
// ici pour ne pas casser les composants qui les importent déjà depuis ce module.
export {
  formatAmount,
  formatDateTime,
  formatFrequency,
  toApiDateTime,
} from "@/lib/format"
export type { FrequencyType } from "@/lib/format"

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

/** L'API renvoie une liste plate, chaque dépense portant son compte. */
interface ExpenseFromApi extends Expense {
  account: Pick<Account, "id" | "name"> | null
}

/** `search` filtre sur le nom court et la description, côté serveur. */
export async function getExpenses(search?: string): Promise<ExpenseWithAccount[]> {
  const { data } = await api.get<ExpenseFromApi[]>("/expenses", {
    params: search ? { search } : undefined,
  })
  return data.map(({ account, ...expense }) => ({
    ...expense,
    account_name: account?.name ?? "—",
  }))
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
