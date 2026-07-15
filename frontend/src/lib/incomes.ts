import api from "@/lib/api"
import type { Account } from "@/lib/accounts"
import type { FrequencyType } from "@/lib/format"

/** Un revenu a exactement la même forme qu'une dépense — seul son signe change. */
export interface Income {
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

export interface IncomeWithAccount extends Income {
  account_name: string
}

export interface IncomeInput {
  name: string
  description?: string
  amount: number
  frequency_type: FrequencyType
  frequency_months?: number | null
  start_date_time: string
  end_date_time?: string | null
  account_id: number
}

interface IncomeFromApi extends Income {
  account: Pick<Account, "id" | "name"> | null
}

export async function getIncomes(search?: string): Promise<IncomeWithAccount[]> {
  const { data } = await api.get<IncomeFromApi[]>("/incomes", {
    params: search ? { search } : undefined,
  })
  return data.map(({ account, ...income }) => ({
    ...income,
    account_name: account?.name ?? "—",
  }))
}

export async function createIncome(input: IncomeInput): Promise<Income> {
  const { data } = await api.post<Income>("/incomes", {
    ...input,
    description: input.description ?? "",
    frequency_months:
      input.frequency_type === "RECURRING" ? input.frequency_months : null,
    end_date_time: input.end_date_time || null,
  })
  return data
}

export async function updateIncome(
  id: number,
  input: Partial<IncomeInput>,
): Promise<Income> {
  const { data } = await api.put<Income>(`/incomes/${id}`, input)
  return data
}

export async function deleteIncome(id: number): Promise<void> {
  await api.delete(`/incomes/${id}`)
}
