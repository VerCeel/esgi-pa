import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { ExceptionsDialog } from "@/components/exceptions/exceptions-dialog"
import { DeleteIncomeDialog } from "@/components/incomes/delete-income-dialog"
import { IncomeFormDialog } from "@/components/incomes/income-form-dialog"
import { getTransactionColumns } from "@/components/transactions-columns"
import { TransactionsDataTable } from "@/components/transactions-data-table"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { getErrorMessage } from "@/lib/api"
import { getIncomes, type IncomeWithAccount } from "@/lib/incomes"

export function IncomesPage() {
  const [incomes, setIncomes] = useState<IncomeWithAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [exceptionsOpen, setExceptionsOpen] = useState(false)
  const [selectedIncome, setSelectedIncome] = useState<IncomeWithAccount | null>(
    null,
  )

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)

  const fetchIncomes = useCallback(async () => {
    setIsLoading(true)
    try {
      setIncomes(await getIncomes(debouncedSearch))
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch])

  useEffect(() => {
    fetchIncomes()
  }, [fetchIncomes])

  const handleEdit = useCallback((income: IncomeWithAccount) => {
    setSelectedIncome(income)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((income: IncomeWithAccount) => {
    setSelectedIncome(income)
    setDeleteOpen(true)
  }, [])

  const handleManageExceptions = useCallback((income: IncomeWithAccount) => {
    setSelectedIncome(income)
    setExceptionsOpen(true)
  }, [])

  const columns = useMemo(
    () =>
      getTransactionColumns<IncomeWithAccount>({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onManageExceptions: handleManageExceptions,
        tone: "income",
      }),
    [handleEdit, handleDelete, handleManageExceptions],
  )

  function handleCreate() {
    setSelectedIncome(null)
    setFormOpen(true)
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <PageHeader
        title="Incomes"
        description="Salaries, bonuses and anything that credits your accounts."
        actions={
          <Button size="sm" onClick={handleCreate}>
            <Plus className="size-4" />
            New income
          </Button>
        }
      />

      {isLoading && incomes.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-md border">
          <p className="text-muted-foreground text-sm">Loading incomes...</p>
        </div>
      ) : (
        <TransactionsDataTable
          columns={columns}
          data={incomes}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Filter by name or description..."
          emptyMessage="No incomes found."
          countLabel={(count) => `${count} income(s)`}
        />
      )}

      <IncomeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        income={selectedIncome}
        onSuccess={fetchIncomes}
      />

      <DeleteIncomeDialog
        income={selectedIncome}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={fetchIncomes}
      />

      <ExceptionsDialog
        open={exceptionsOpen}
        onOpenChange={setExceptionsOpen}
        target="incomes"
        transaction={selectedIncome}
      />
    </div>
  )
}
