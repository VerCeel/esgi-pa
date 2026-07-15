import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  formatLocalDate,
  parseLocalDate,
  parseTimePart,
} from "@/lib/format"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  id?: string
  /** Valeur au format API : "YYYY-MM-DD HH:mm:ss" (ou vide). */
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  placeholder?: string
  /** Masque le champ heure quand seule la date a un sens (ouverture d'un compte). */
  withTime?: boolean
}

export function DateTimePicker({
  id,
  value,
  onChange,
  disabled,
  invalid,
  placeholder = "Pick a date",
  withTime = true,
}: DateTimePickerProps) {
  const selected = parseLocalDate(value)
  const time = parseTimePart(value)

  function handleDateSelect(date: Date | undefined) {
    if (!date) {
      onChange("")
      return
    }

    onChange(`${formatLocalDate(date)} ${time}:00`)
  }

  function handleTimeChange(nextTime: string) {
    // Choisir une heure avant une date n'a pas de sens : on ancre sur aujourd'hui.
    const datePart = selected
      ? formatLocalDate(selected)
      : formatLocalDate(new Date())
    onChange(`${datePart} ${nextTime || "00:00"}:00`)
  }

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={invalid}
            className={cn(
              "flex-1 justify-start text-left font-normal",
              !selected && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-4" />
            {selected
              ? selected.toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleDateSelect}
            captionLayout="dropdown"
            // Les prévisions vont loin dans le futur, et un compte peut avoir été
            // ouvert il y a vingt ans : on ouvre large.
            startMonth={new Date(1990, 0)}
            endMonth={new Date(2060, 11)}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      {withTime && (
        <Input
          type="time"
          value={time}
          onChange={(e) => handleTimeChange(e.target.value)}
          disabled={disabled}
          aria-label="Time"
          className="w-[7.5rem]"
        />
      )}
    </div>
  )
}
