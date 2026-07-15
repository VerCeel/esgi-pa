import { useCallback, useEffect, useMemo, useState } from "react"
import { Coins, Plus, Wallet } from "lucide-react"
import { toast } from "sonner"
import { AccountFormDialog } from "@/components/accounts/account-form-dialog"
import { getAccountColumns } from "@/components/accounts/accounts-columns"
import { AccountsDataTable } from "@/components/accounts/accounts-data-table"
import { DeleteAccountDialog } from "@/components/accounts/delete-account-dialog"
import { ShareAccountDialog } from "@/components/accounts/share-account-dialog"
import { PageHeader } from "@/components/page-header"
import { StatTile } from "@/components/stat-tile"
import { Button } from "@/components/ui/button"
import { getAccounts, type Account } from "@/lib/accounts"
import { getErrorMessage } from "@/lib/api"
import { formatAmount } from "@/lib/format"

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
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

  const handleShare = useCallback((account: Account) => {
    setSelectedAccount(account)
    setShareOpen(true)
  }, [])

  const columns = useMemo(
    () =>
      getAccountColumns({
        onEdit: handleEdit,
        onDelete: handleDelete,
        onShare: handleShare,
      }),
    [handleEdit, handleDelete, handleShare],
  )

  function handleCreate() {
    setSelectedAccount(null)
    setFormOpen(true)
  }

  // Le solde et les intérêts viennent du serveur : on ne fait que les additionner.
  const totalBalance = accounts.reduce(
    (sum, account) => sum + Number(account.balance),
    0,
  )
  const totalInterest = accounts.reduce(
    (sum, account) => sum + Number(account.total_interest),
    0,
  )

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <PageHeader
        title="Accounts"
        description="Current, savings, investment — each with its own rate and tax."
        actions={
          <Button size="sm" onClick={handleCreate}>
            <Plus className="size-4" />
            New account
          </Button>
        }
      />

      {!isLoading && accounts.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <StatTile
            label="Total balance"
            value={formatAmount(totalBalance)}
            hint={`Across ${accounts.length} account(s)`}
            icon={Wallet}
            tone="cyan"
            muted={totalBalance < 0}
          />
          <StatTile
            label="Interest earned"
            value={formatAmount(totalInterest)}
            hint="Net of tax, since each account opened"
            icon={Coins}
            tone="gold"
          />
        </div>
      )}

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

      <ShareAccountDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        account={selectedAccount}
      />
    </div>
  )
}
