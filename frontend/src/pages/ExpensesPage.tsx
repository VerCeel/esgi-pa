import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { ExceptionsDialog } from "@/components/exceptions/exceptions-dialog"
import { DeleteExpenseDialog } from "@/components/expenses/delete-expense-dialog"
import { ExpenseFormDialog } from "@/components/expenses/expense-form-dialog"
import { getTransactionColumns } from "@/components/transactions-columns"
import { TransactionsDataTable } from "@/components/transactions-data-table"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { getErrorMessage } from "@/lib/api"
import { getExpenses, type ExpenseWithAccount } from "@/lib/expenses"

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseWithAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [exceptionsOpen, setExceptionsOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] =
    useState<ExpenseWithAccount | null>(null)

  // Le filtre est appliqué par le serveur, sur le nom court et la description.
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true)
    try {
      setExpenses(await getExpenses(debouncedSearch))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch])

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

  const handleManageExceptions = useCallback((expense: ExpenseWithAccount) => {
    setSelectedExpense(expense)
    setExceptionsOpen(true)
  }, [])

  const columns = useMemo(
    () =>
      getTransactionColumns<ExpenseWithAccount>({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onManageExceptions: handleManageExceptions,
        tone: "expense",
      }),
    [handleEdit, handleDelete, handleManageExceptions],
  )

  function handleCreate() {
    setSelectedExpense(null)
    setFormOpen(true)
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <PageHeader
        title="Expenses"
        description="Track and manage your expenses across accounts."
        actions={
          <Button size="sm" onClick={handleCreate}>
            <Plus className="size-4" />
            New expense
          </Button>
        }
      />

      {/* Pendant une recherche, on garde la table à l'écran plutôt que de la remplacer
          par un écran de chargement à chaque frappe. */}
      {isLoading && expenses.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-md border">
          <p className="text-muted-foreground text-sm">Loading expenses...</p>
        </div>
      ) : (
        <TransactionsDataTable
          columns={columns}
          data={expenses}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Filter by name or description..."
          emptyMessage="No expenses found."
          countLabel={(count) => `${count} expense(s)`}
        />
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

      <ExceptionsDialog
        open={exceptionsOpen}
        onOpenChange={setExceptionsOpen}
        target="expenses"
        transaction={selectedExpense}
      />
    </div>
  )
}
