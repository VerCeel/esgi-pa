import api from "@/lib/api"

export interface ForecastLine {
  account_id: number
  account_name: string
  remuneration_rate: number
  tax_rate: number
  balance: number
  total_income: number
  total_expense: number
  /** Intérêts cumulés, déjà nets d'impôt. */
  total_interest: number
}

export interface Forecast {
  month: string
  /** Dernier jour du mois projeté. */
  as_of: string
  accounts: ForecastLine[]
  total_balance: number
  total_interest: number
}

/** `month` est au format "YYYY-MM" — c'est ce que produit <input type="month">. */
export async function getForecast(month: string): Promise<Forecast> {
  const { data } = await api.get<Forecast>("/forecast", { params: { month } })
  return data
}
