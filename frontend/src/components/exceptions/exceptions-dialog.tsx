import { useCallback, useEffect, useState, type FormEvent } from "react"
import { AlertCircle, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DateTimePicker } from "@/components/ui/date-time-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getErrorMessage, getFieldErrors } from "@/lib/api"
import {
  createException,
  deleteException,
  getExceptions,
  type ExceptionInput,
  type ExceptionTarget,
  type TransactionException,
} from "@/lib/exceptions"
import {
  formatAmount,
  formatDate,
  formatFrequency,
  toApiDateTime,
  type FrequencyType,
} from "@/lib/format"

interface ExceptionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  target: ExceptionTarget
  /** La transaction surchargée : c'est son montant initial qui reste la référence. */
  transaction: { id: number; name: string; amount: string | number } | null
  /** Rafraîchit la liste parente : une exception change les prévisions. */
  onChange?: () => void
}

const emptyForm: ExceptionInput = {
  name: "",
  description: "",
  amount: 0,
  frequency_type: "ONCE",
  frequency_months: null,
  start_date_time: "",
  end_date_time: "",
}

export function ExceptionsDialog({
  open,
  onOpenChange,
  target,
  transaction,
  onChange,
}: ExceptionsDialogProps) {
  const [exceptions, setExceptions] = useState<TransactionException[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [form, setForm] = useState<ExceptionInput>(emptyForm)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchExceptions = useCallback(async () => {
    if (!transaction) return

    setIsLoading(true)
    try {
      setExceptions(await getExceptions(target, transaction.id))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [target, transaction])

  useEffect(() => {
    if (!open) return

    setIsAdding(false)
    setForm(emptyForm)
    setStartDate("")
    setEndDate("")
    setError("")
    setFieldErrors({})
    fetchExceptions()
  }, [open, fetchExceptions])

  function updateField<K extends keyof ExceptionInput>(
    key: K,
    value: ExceptionInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!transaction) return

    setError("")
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      await createException(target, transaction.id, {
        ...form,
        start_date_time: toApiDateTime(startDate),
        end_date_time: endDate ? toApiDateTime(endDate) : null,
      })
      toast.success("Exception added")
      setIsAdding(false)
      setForm(emptyForm)
      setStartDate("")
      setEndDate("")
      await fetchExceptions()
      onChange?.()
    } catch (err) {
      const errors = getFieldErrors(err)
      if (Object.keys(errors).length > 0) {
        const mapped: Record<string, string> = {}
        for (const [field, messages] of Object.entries(errors)) {
          mapped[field] = messages[0]
        }
        setFieldErrors(mapped)
      } else {
        const message = getErrorMessage(err)
        setError(message)
        toast.error(message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteException(id)
      toast.success("Exception removed")
      await fetchExceptions()
      onChange?.()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Exceptions — {transaction?.name}</DialogTitle>
          <DialogDescription>
            An exception replaces the amount for the months it covers. The original
            amount ({formatAmount(transaction?.amount)}) never changes, and the
            months outside the exception are untouched.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Loading exceptions...
            </p>
          ) : exceptions.length === 0 ? (
            <p className="text-muted-foreground rounded-md border py-6 text-center text-sm">
              No exception yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {exceptions.map((exception) => (
                <li
                  key={exception.id}
                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {exception.name}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatAmount(exception.amount)} ·{" "}
                      {formatFrequency(exception)} · from{" "}
                      {formatDate(exception.start_date_time)}
                      {exception.end_date_time
                        ? ` to ${formatDate(exception.end_date_time)}`
                        : ""}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-destructive shrink-0"
                    onClick={() => handleDelete(exception.id)}
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Remove exception</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {isAdding ? (
            <form onSubmit={handleSubmit} className="space-y-4 border-t pt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="exception-name">Name</Label>
                <Input
                  id="exception-name"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Summer holidays"
                  required
                  aria-invalid={!!fieldErrors.name}
                />
                {fieldErrors.name && (
                  <p className="text-destructive text-sm">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exception-description">Description</Label>
                <Input
                  id="exception-description"
                  value={form.description ?? ""}
                  onChange={(e) => updateField("description", e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="exception-amount">Amount instead of</Label>
                  <Input
                    id="exception-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.amount || ""}
                    onChange={(e) => updateField("amount", Number(e.target.value))}
                    required
                    aria-invalid={!!fieldErrors.amount}
                  />
                  {fieldErrors.amount && (
                    <p className="text-destructive text-sm">
                      {fieldErrors.amount}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exception-frequency">Frequency</Label>
                  <Select
                    value={form.frequency_type}
                    onValueChange={(value) =>
                      updateField("frequency_type", value as FrequencyType)
                    }
                  >
                    <SelectTrigger className="w-full" id="exception-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONCE">Once</SelectItem>
                      <SelectItem value="RECURRING">Recurring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.frequency_type === "RECURRING" && (
                <div className="space-y-2">
                  <Label htmlFor="exception-months">Every (months)</Label>
                  <Input
                    id="exception-months"
                    type="number"
                    min="1"
                    value={form.frequency_months ?? ""}
                    onChange={(e) =>
                      updateField(
                        "frequency_months",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    required
                    aria-invalid={!!fieldErrors.frequency_months}
                  />
                  {fieldErrors.frequency_months && (
                    <p className="text-destructive text-sm">
                      {fieldErrors.frequency_months}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="exception-start">Start date</Label>
                  <DateTimePicker
                    id="exception-start"
                    value={startDate}
                    onChange={setStartDate}
                    invalid={!!fieldErrors.start_date_time}
                  />
                  {fieldErrors.start_date_time && (
                    <p className="text-destructive text-sm">
                      {fieldErrors.start_date_time}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exception-end">End date (optional)</Label>
                  <DateTimePicker
                    id="exception-end"
                    value={endDate}
                    onChange={setEndDate}
                    invalid={!!fieldErrors.end_date_time}
                    placeholder="No end date"
                  />
                  {fieldErrors.end_date_time && (
                    <p className="text-destructive text-sm">
                      {fieldErrors.end_date_time}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || !startDate}>
                  {isSubmitting ? "Adding..." : "Add exception"}
                </Button>
              </div>
            </form>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="size-4" />
              Add an exception
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button type="button" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
