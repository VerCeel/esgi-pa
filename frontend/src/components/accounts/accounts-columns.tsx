import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Account } from "@/lib/accounts"
import { formatAmount, formatDate, formatRate } from "@/lib/format"

interface AccountColumnActions {
  onEdit: (account: Account) => void
  onDelete: (account: Account) => void
  onShare: (account: Account) => void
}

export function getAccountColumns({
  onEdit,
  onDelete,
  onShare,
}: AccountColumnActions): ColumnDef<Account>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const value = row.getValue("description") as string | null
        return (
          <span className="text-muted-foreground block max-w-[200px] truncate">
            {value || "—"}
          </span>
        )
      },
    },
    {
      // Le solde vient du serveur : même moteur que les prévisions, appliqué au mois courant.
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => {
        const balance = Number(row.getValue("balance"))
        return (
          <span
            className={
              balance < 0
                ? "text-destructive font-medium"
                : "text-brand-cyan font-medium"
            }
          >
            {formatAmount(balance)}
          </span>
        )
      },
    },
    {
      accessorKey: "remuneration_rate",
      header: "Remuneration",
      cell: ({ row }) => formatRate(row.getValue("remuneration_rate")),
    },
    {
      accessorKey: "tax_rate",
      header: "Tax rate",
      cell: ({ row }) => formatRate(row.getValue("tax_rate")),
    },
    {
      accessorKey: "creation_date",
      header: "Opened",
      cell: ({ row }) => formatDate(row.getValue("creation_date")),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const account = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(account)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(account)}>
                <Share2 className="size-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(account)}
              >
                <Trash2 className="size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}
