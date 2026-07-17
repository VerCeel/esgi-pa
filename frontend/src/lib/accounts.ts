import api from "@/lib/api"

export { formatRate } from "@/lib/format"

export interface Account {
  id: number
  name: string
  description: string | null
  /** Date d'ouverture réelle du compte : le point de départ des prévisions. */
  creation_date: string | null
  remuneration_rate: string | number | null
  tax_rate: string | number | null
  /** Solde à aujourd'hui, calculé par le serveur avec les mêmes règles que les prévisions. */
  balance: number
  total_interest: number
  user_id: number
  created_at: string
  updated_at: string
}

/** Un compte qu'on m'a partagé : mêmes données, mais je ne peux rien y modifier. */
export interface SharedAccount extends Account {
  read_only: true
  owner: { id: number; name: string; email: string } | null
}

export interface AccountInput {
  name: string
  description?: string
  creation_date?: string | null
  remuneration_rate?: number | null
  tax_rate?: number | null
}

export async function getAccounts(): Promise<Account[]> {
  const { data } = await api.get<Account[]>("/accounts")
  return data
}

export async function getSharedAccounts(): Promise<SharedAccount[]> {
  const { data } = await api.get<SharedAccount[]>("/accounts/shared")
  return data
}

export async function createAccount(input: AccountInput): Promise<Account> {
  const { data } = await api.post<Account>("/accounts", {
    name: input.name,
    description: input.description ?? "",
    creation_date: input.creation_date || null,
    remuneration_rate: input.remuneration_rate ?? 0,
    tax_rate: input.tax_rate ?? 0,
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

/** Quitter un compte qu'on m'a partagé : je retire mon propre accès. */
export async function leaveSharedAccount(id: number): Promise<void> {
  await api.delete(`/accounts/shared/${id}`)
}
