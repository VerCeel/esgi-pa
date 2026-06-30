import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { DeleteExpenseDialog } from "@/components/expenses/delete-expense-dialog"
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog"
import { getExpenseColumns } from "@/components/expenses/expenses-columns"
import { ExpensesDataTable } from "@/components/expenses/expenses-data-table"
import { Button } from "@/components/ui/button"
import { getExpenses, type ExpenseWithAccount } from "@/lib/expenses"
import { getErrorMessage } from "@/lib/api"

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] =
    useState<ExpenseWithAccount | null>(null)

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getExpenses()
      setExpenses(data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const handleEdit = useCallback((expense: ExpenseWithAccount) => {
    setSelectedExpense(expense)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((expense: ExpenseWithAccount) => {
    setSelectedExpense(expense)
    setDeleteOpen(true)
  }, [])

  const columns = useMemo(
    () => getExpenseColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  )

  function handleCreate() {
    setSelectedExpense(null)
    setFormOpen(true)
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage your expenses across accounts.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchExpenses}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="size-4" />
            New expense
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-md border">
          <p className="text-muted-foreground text-sm">Loading expenses...</p>
        </div>
      ) : (
        <ExpensesDataTable columns={columns} data={expenses} />
      )}

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        expense={selectedExpense}
        onSuccess={fetchExpenses}
      />

      <DeleteExpenseDialog
        expense={selectedExpense}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={fetchExpenses}
      />
    </div>
  )
}
