import api from "@/lib/api"
import type { FrequencyType } from "@/lib/format"

/**
 * Une exception surcharge le montant d'une dépense ou d'un revenu sur les mois qu'elle
 * couvre, sans jamais modifier le montant initial de la transaction.
 */
export interface TransactionException {
  id: number
  name: string
  description: string | null
  amount: string | number
  frequency_type: FrequencyType
  frequency_months: number | null
  start_date_time: string | null
  end_date_time: string | null
  created_at: string
  updated_at: string
}

export interface ExceptionInput {
  name: string
  description?: string
  amount: number
  frequency_type: FrequencyType
  frequency_months?: number | null
  start_date_time: string
  end_date_time?: string | null
}

/** Une exception se rattache soit à une dépense, soit à un revenu. */
export type ExceptionTarget = "expenses" | "incomes"

export async function getExceptions(
  target: ExceptionTarget,
  transactionId: number,
): Promise<TransactionException[]> {
  const { data } = await api.get<TransactionException[]>(
    `/${target}/${transactionId}/exceptions`,
  )
  return data
}

export async function createException(
  target: ExceptionTarget,
  transactionId: number,
  input: ExceptionInput,
): Promise<TransactionException> {
  const { data } = await api.post<TransactionException>(
    `/${target}/${transactionId}/exceptions`,
    {
      ...input,
      description: input.description ?? "",
      frequency_months:
        input.frequency_type === "RECURRING" ? input.frequency_months : null,
      end_date_time: input.end_date_time || null,
    },
  )
  return data
}

export async function deleteException(id: number): Promise<void> {
  await api.delete(`/exceptions/${id}`)
}
