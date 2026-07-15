import api from "@/lib/api"

export interface AccountShare {
  id: number
  account_id: number
  email: string
  user_id: number | null
  /** Null tant que l'invité n'a pas cliqué sur le lien reçu par email. */
  accepted_at: string | null
  created_at: string
  user: { id: number; name: string; email: string } | null
}

export async function getShares(accountId: number): Promise<AccountShare[]> {
  const { data } = await api.get<AccountShare[]>(`/accounts/${accountId}/shares`)
  return data
}

export async function shareAccount(
  accountId: number,
  email: string,
): Promise<AccountShare> {
  const { data } = await api.post<AccountShare>(`/accounts/${accountId}/shares`, {
    email,
  })
  return data
}

/** Retirer un partage coupe l'accès de l'invité immédiatement. */
export async function revokeShare(
  accountId: number,
  shareId: number,
): Promise<void> {
  await api.delete(`/accounts/${accountId}/shares/${shareId}`)
}

/** Accepter une invitation depuis le lien reçu par email. */
export async function acceptShare(
  token: string,
): Promise<{ account: { id: number; name: string } }> {
  const { data } = await api.post<{ account: { id: number; name: string } }>(
    `/shares/${token}/accept`,
  )
  return data
}
