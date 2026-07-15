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
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  createAccount,
  updateAccount,
  type Account,
  type AccountInput,
} from "@/lib/accounts"
import { getErrorMessage, getFieldErrors } from "@/lib/api"
import { toInputDate } from "@/lib/format"

interface AccountFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account?: Account | null
  onSuccess: () => void
}

const emptyForm: AccountInput = {
  name: "",
  description: "",
  creation_date: "",
  remuneration_rate: null,
  tax_rate: null,
}

export function AccountFormDialog({
  open,
  onOpenChange,
  account,
  onSuccess,
}: AccountFormDialogProps) {
  const isEditing = !!account
  const [form, setForm] = useState<AccountInput>(emptyForm)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      if (account) {
        setForm({
          name: account.name,
          description: account.description ?? "",
          creation_date: toInputDate(account.creation_date),
          remuneration_rate: account.remuneration_rate
            ? Number(account.remuneration_rate)
            : null,
          tax_rate: account.tax_rate ? Number(account.tax_rate) : null,
        })
      } else {
        setForm(emptyForm)
      }
      setError("")
      setFieldErrors({})
    }
  }, [open, account])

  function updateField<K extends keyof AccountInput>(
    key: K,
    value: AccountInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})
    setIsSubmitting(true)

    try {
      if (isEditing && account) {
        await updateAccount(account.id, form)
        toast.success("Account updated successfully")
      } else {
        await createAccount(form)
        toast.success("Account created successfully")
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit account" : "New account"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the account details below."
              : "Fill in the details to create a new account."}
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
            <Label htmlFor="account-name">Name</Label>
            <Input
              id="account-name"
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
            <Label htmlFor="account-description">Description</Label>
            <Textarea
              id="account-description"
              value={form.description ?? ""}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
              aria-invalid={!!fieldErrors.description}
            />
            {fieldErrors.description && (
              <p className="text-destructive text-sm">
                {fieldErrors.description}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="account-creation-date">Opening date</Label>
            <DatePicker
              id="account-creation-date"
              value={form.creation_date ?? ""}
              onChange={(value) => updateField("creation_date", value)}
              invalid={!!fieldErrors.creation_date}
              placeholder="Today"
            />
            <p className="text-muted-foreground text-xs">
              When the account was actually opened. Forecasts start from this date.
              Defaults to today.
            </p>
            {fieldErrors.creation_date && (
              <p className="text-destructive text-sm">
                {fieldErrors.creation_date}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-remuneration">Remuneration rate (%)</Label>
              <Input
                id="account-remuneration"
                type="number"
                min="0"
                step="0.01"
                value={form.remuneration_rate ?? ""}
                onChange={(e) =>
                  updateField(
                    "remuneration_rate",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                aria-invalid={!!fieldErrors.remuneration_rate}
              />
              {fieldErrors.remuneration_rate && (
                <p className="text-destructive text-sm">
                  {fieldErrors.remuneration_rate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-tax">Tax rate (%)</Label>
              <Input
                id="account-tax"
                type="number"
                min="0"
                step="0.01"
                value={form.tax_rate ?? ""}
                onChange={(e) =>
                  updateField(
                    "tax_rate",
                    e.target.value === "" ? null : Number(e.target.value),
                  )
                }
                aria-invalid={!!fieldErrors.tax_rate}
              />
              {fieldErrors.tax_rate && (
                <p className="text-destructive text-sm">{fieldErrors.tax_rate}</p>
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? "Saving..."
                  : "Creating..."
                : isEditing
                  ? "Save changes"
                  : "Create account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
