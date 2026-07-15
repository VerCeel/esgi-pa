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
import { toApiDateTime, type FrequencyType } from "@/lib/format"
import {
  createIncome,
  updateIncome,
  type IncomeInput,
  type IncomeWithAccount,
} from "@/lib/incomes"

interface IncomeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  income?: IncomeWithAccount | null
  onSuccess: () => void
}

const emptyForm: IncomeInput = {
  name: "",
  description: "",
  amount: 0,
  frequency_type: "ONCE",
  frequency_months: null,
  start_date_time: "",
  end_date_time: "",
  account_id: 0,
}

export function IncomeFormDialog({
  open,
  onOpenChange,
  income,
  onSuccess,
}: IncomeFormDialogProps) {
  const isEditing = !!income
  const [accounts, setAccounts] = useState<Account[]>([])
  const [form, setForm] = useState<IncomeInput>(emptyForm)
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
      if (income) {
        setForm({
          name: income.name,
          description: income.description ?? "",
          amount: Number(income.amount),
          frequency_type: income.frequency_type,
          frequency_months: income.frequency_months,
          start_date_time: income.start_date_time ?? "",
          end_date_time: income.end_date_time ?? "",
          account_id: income.account_id,
        })
        setStartDate(toApiDateTime(income.start_date_time))
        setEndDate(toApiDateTime(income.end_date_time))
      } else {
        setForm(emptyForm)
        setStartDate("")
        setEndDate("")
      }
      setError("")
      setFieldErrors({})
    }
  }, [open, income])

  function updateField<K extends keyof IncomeInput>(
    key: K,
    value: IncomeInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    setIsSubmitting(true)

    const payload: IncomeInput = {
      ...form,
      start_date_time: toApiDateTime(startDate),
      end_date_time: endDate ? toApiDateTime(endDate) : null,
      frequency_months:
        form.frequency_type === "RECURRING" ? form.frequency_months : null,
    }

    try {
      if (isEditing && income) {
        await updateIncome(income.id, payload)
        toast.success("Income updated successfully")
      } else {
        await createIncome(payload)
        toast.success("Income created successfully")
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
          <DialogTitle>{isEditing ? "Edit income" : "New income"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the income details below."
              : "Fill in the details to track a new income."}
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
            <Label htmlFor="income-account">Account</Label>
            <Select
              value={form.account_id ? String(form.account_id) : undefined}
              onValueChange={(value) => updateField("account_id", Number(value))}
              required
            >
              <SelectTrigger className="w-full" id="income-account">
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
            <Label htmlFor="income-name">Name</Label>
            <Input
              id="income-name"
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
            <Label htmlFor="income-description">Description</Label>
            <Textarea
              id="income-description"
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
            <Label htmlFor="income-amount">Amount</Label>
            <Input
              id="income-amount"
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
              <Label htmlFor="income-frequency">Frequency</Label>
              <Select
                value={form.frequency_type}
                onValueChange={(value) =>
                  updateField("frequency_type", value as FrequencyType)
                }
              >
                <SelectTrigger className="w-full" id="income-frequency">
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
                <Label htmlFor="income-frequency-months">Every (months)</Label>
                <Input
                  id="income-frequency-months"
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
              <Label htmlFor="income-start">Start date</Label>
              <DateTimePicker
                id="income-start"
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
              <Label htmlFor="income-end">End date (optional)</Label>
              <DateTimePicker
                id="income-end"
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
                  : "Create income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
