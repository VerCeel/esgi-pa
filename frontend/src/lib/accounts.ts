import api from "@/lib/api"

export interface Account {
  id: number
  name: string
  description: string | null
  remuneration_rate: string | number | null
  tax_rate: string | number | null
  user_id: number
  created_at: string
  updated_at: string
}

export interface AccountInput {
  name: string
  description?: string
  remuneration_rate?: number | null
  tax_rate?: number | null
}

export async function getAccounts(): Promise<Account[]> {
  const { data } = await api.get<Account[]>("/accounts")
  return data
}

export async function createAccount(input: AccountInput): Promise<Account> {
  const { data } = await api.post<Account>("/accounts", {
    name: input.name,
    description: input.description ?? "",
    remuneration_rate: input.remuneration_rate ?? null,
    tax_rate: input.tax_rate ?? null,
  })
  return data
}

export async function updateAccount(
  id: number,
  input: Partial<AccountInput>,
): Promise<Account> {
  const { data } = await api.put<Account>(`/accounts/${id}`, input)
  return data
}

export async function deleteAccount(id: number): Promise<void> {
  await api.delete(`/accounts/${id}`)
}

export function formatRate(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "—"
  }
  const num = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(num)) return "—"
  return `${num.toFixed(2)}%`
}
