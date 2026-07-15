import { useEffect, useState, type FormEvent } from "react"
import { AlertCircle } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { getAccounts, type Account } from "@/lib/accounts"
import { getErrorMessage, getFieldErrors } from "@/lib/api"
import { toApiDateTime } from "@/lib/format"
import {
  createExpense,
  updateExpense,
  type ExpenseInput,
  type ExpenseWithAccount,
  type FrequencyType,
} from "@/lib/expenses"

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense?: ExpenseWithAccount | null
  onSuccess: () => void
}

const emptyForm: ExpenseInput = {
  name: "",
  description: "",
  amount: 0,
  frequency_type: "ONCE",
  frequency_months: null,
  start_date_time: "",
  end_date_time: "",
  account_id: 0,
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  onSuccess,
}: ExpenseFormDialogProps) {
  const isEditing = !!expense
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState<ExpenseInput>(emptyForm)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      getAccounts()
        .then(setAccounts)
        .catch(() => toast.error("Failed to load accounts"))
    }
  }, [open])

  useEffect(() => {
    if (open) {
      if (expense) {
        setForm({
          name: expense.name,
          description: expense.description ?? "",
          amount: Number(expense.amount),
          frequency_type: expense.frequency_type,
          frequency_months: expense.frequency_months,
          start_date_time: expense.start_date_time ?? "",
          end_date_time: expense.end_date_time ?? "",
          account_id: expense.account_id,
        })
        setStartDate(toApiDateTime(expense.start_date_time))
        setEndDate(toApiDateTime(expense.end_date_time))
      } else {
        setForm(emptyForm)
        setStartDate("")
        setEndDate("")
      }
      setError("")
      setFieldErrors({})
    }
  }, [open, expense])

  function updateField<K extends keyof ExpenseInput>(
    key: K,
    value: ExpenseInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    setIsSubmitting(true)

    const payload: ExpenseInput = {
      ...form,
      start_date_time: toApiDateTime(startDate),
      end_date_time: endDate ? toApiDateTime(endDate) : null,
      frequency_months:
        form.frequency_type === "RECURRING" ? form.frequency_months : null,
    }

    try {
      if (isEditing && expense) {
        await updateExpense(expense.id, payload)
        toast.success("Expense updated successfully")
      } else {
        await createExpense(payload)
        toast.success("Expense created successfully")
      }
      onSuccess()
      onOpenChange(false)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit expense" : "New expense"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the expense details below."
              : "Fill in the details to track a new expense."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="expense-account">Account</Label>
            <Select
              value={form.account_id ? String(form.account_id) : undefined}
              onValueChange={(value) =>
                updateField("account_id", Number(value))
              }
              required
            >
              <SelectTrigger className="w-full" id="expense-account">
                <SelectValue placeholder="Select an account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={String(account.id)}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.account_id && (
              <p className="text-destructive text-sm">{fieldErrors.account_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-name">Name</Label>
            <Input
              id="expense-name"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              required
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name && (
              <p className="text-destructive text-sm">{fieldErrors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-description">Description</Label>
            <Textarea
              id="expense-description"
              value={form.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
              rows={2}
              aria-invalid={!!fieldErrors.description}
            />
            {fieldErrors.description && (
              <p className="text-destructive text-sm">
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expense-amount">Amount</Label>
            <Input
              id="expense-amount"
              type="number"
              min="0"
              step="0.01"
              value={form.amount || ""}
              onChange={(e) => updateField("amount", Number(e.target.value))}
              required
              aria-invalid={!!fieldErrors.amount}
            />
            {fieldErrors.amount && (
              <p className="text-destructive text-sm">{fieldErrors.amount}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="expense-frequency">Frequency</Label>
              <Select
                value={form.frequency_type}
                onValueChange={(value) =>
                  updateField("frequency_type", value as FrequencyType)
                }
              >
                <SelectTrigger className="w-full" id="expense-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONCE">Once</SelectItem>
                  <SelectItem value="RECURRING">Recurring</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.frequency_type && (
                <p className="text-destructive text-sm">
                  {fieldErrors.frequency_type}
                </p>
              )}
            </div>

            {form.frequency_type === "RECURRING" && (
              <div className="space-y-2">
                <Label htmlFor="expense-frequency-months">
                  Every (months)
                </Label>
                <Input
                  id="expense-frequency-months"
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
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-start">Start date</Label>
              <DateTimePicker
                id="expense-start"
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
              <Label htmlFor="expense-end">End date (optional)</Label>
              <DateTimePicker
                id="expense-end"
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            {/* Le picker n'est pas un <input>, il ne peut donc pas porter `required` :
                c'est le bouton qui garde la contrainte. */}
            <Button
              type="submit"
              disabled={isSubmitting || !form.account_id || !startDate}
            >
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save changes"
                  : "Create expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
