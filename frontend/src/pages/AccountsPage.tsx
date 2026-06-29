import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { AccountFormDialog } from "@/components/accounts/account-form-dialog"
import { getAccountColumns } from "@/components/accounts/accounts-columns"
import { AccountsDataTable } from "@/components/accounts/accounts-data-table"
import { DeleteAccountDialog } from "@/components/accounts/delete-account-dialog"
import { Button } from "@/components/ui/button"
import { getAccounts, type Account } from "@/lib/accounts"
import { getErrorMessage } from "@/lib/api"

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)

  const fetchAccounts = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAccounts()
      setAccounts(data)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAccounts()
  }, [fetchAccounts])

  const handleEdit = useCallback((account: Account) => {
    setSelectedAccount(account)
    setFormOpen(true)
  }, [])

  const handleDelete = useCallback((account: Account) => {
    setSelectedAccount(account)
    setDeleteOpen(true)
  }, [])

  const columns = useMemo(
    () => getAccountColumns({ onEdit: handleEdit, onDelete: handleDelete }),
    [handleEdit, handleDelete],
  )

  function handleCreate() {
    setSelectedAccount(null)
    setFormOpen(true)
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage your financial accounts in Budgie.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchAccounts}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={handleCreate}>
            <Plus className="size-4" />
            New account
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center rounded-md border">
          <p className="text-muted-foreground text-sm">Loading accounts...</p>
        </div>
      ) : (
        <AccountsDataTable columns={columns} data={accounts} />
      )}

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={selectedAccount}
        onSuccess={fetchAccounts}
      />

      <DeleteAccountDialog
        account={selectedAccount}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={fetchAccounts}
      />
    </div>
  )
}
