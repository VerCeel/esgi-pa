/**
 * Formatteurs partagés par les dépenses, les revenus et les prévisions.
 * Ils vivent ici plutôt que dans expenses.ts pour que les revenus n'aient pas
 * à importer depuis le module des dépenses.
 */

export type FrequencyType = "ONCE" | "RECURRING"

/** Une dépense, un revenu et une exception ont tous la même forme temporelle. */
export interface Recurrence {
  frequency_type: FrequencyType
  frequency_months: number | null
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

export function formatRate(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—"
  const num = typeof value === "string" ? parseFloat(value) : value
  if (Number.isNaN(num)) return "—"
  return `${num.toFixed(2)}%`
}

export function formatFrequency(item: Recurrence): string {
  if (item.frequency_type === "ONCE") return "Once"
  if (item.frequency_months === 1) return "Every month"
  if (item.frequency_months) return `Every ${item.frequency_months} months`
  return "Recurring"
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—"
  return new Date(value.replace(" ", "T")).toLocaleString()
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—"
  return new Date(value.replace(" ", "T")).toLocaleDateString()
}

/**
 * Normalise vers le format attendu par l'API : "Y-m-d H:i:s".
 *
 * Accepte aussi bien ce que rend le date picker ("2025-01-01 09:30:00") que l'ISO
 * renvoyé par Laravel ("2025-01-01T09:30:00.000000Z") — sinon rouvrir un formulaire
 * puis le renvoyer tel quel casserait la valeur.
 */
export function toApiDateTime(value: string | null | undefined): string {
  if (!value) return ""

  const [datePart, rawTime = "00:00:00"] = value.replace("T", " ").split(" ")
  const time = rawTime.slice(0, 8)

  return `${datePart} ${time.length === 5 ? `${time}:00` : time}`
}

/** L'API peut renvoyer un ISO complet là où seule la date compte. */
export function toInputDate(value: string | null | undefined): string {
  if (!value) return ""
  return value.slice(0, 10)
}

/**
 * Découpe une date "YYYY-MM-DD..." en objet Date **local**, pour le calendrier.
 *
 * Surtout ne pas passer par `new Date("2025-01-01")` : JavaScript interprète cette forme
 * en UTC puis la réaffiche en heure locale, si bien qu'à l'ouest de Greenwich on
 * afficherait le 31 décembre. En découpant la chaîne à la main, la date saisie reste
 * exactement la date stockée.
 */
export function parseLocalDate(value: string): Date | undefined {
  if (!value) return undefined

  const [datePart] = value.split(/[ T]/)
  const [year, month, day] = datePart.split("-").map(Number)

  if (!year || !month || !day) return undefined

  return new Date(year, month - 1, day)
}

/** L'heure "HH:mm" portée par une valeur, ou minuit par défaut. */
export function parseTimePart(value: string): string {
  const [, timePart] = value.split(/[ T]/)
  return timePart ? timePart.slice(0, 5) : "00:00"
}

/** L'inverse de parseLocalDate : un objet Date vers "YYYY-MM-DD", sans passage par UTC. */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}
