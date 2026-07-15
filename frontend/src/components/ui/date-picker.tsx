import { DateTimePicker } from "@/components/ui/date-time-picker"

interface DatePickerProps {
  id?: string
  /** Valeur au format "YYYY-MM-DD". */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
}

/**
 * Calendrier sans heure, pour les champs où seule la date compte (l'ouverture d'un
 * compte). Il réutilise le DateTimePicker et se contente de couper la partie horaire.
 */
export function DatePicker({
  id,
  value,
  onChange,
  disabled,
  invalid,
  placeholder,
}: DatePickerProps) {
  return (
    <DateTimePicker
      id={id}
      value={value}
      onChange={(next) => onChange(next ? next.slice(0, 10) : "")}
      disabled={disabled}
      invalid={invalid}
      placeholder={placeholder}
      withTime={false}
    />
  )
}
