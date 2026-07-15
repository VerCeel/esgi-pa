import type { ColumnDef } from "@tanstack/react-table"
import { CalendarClock, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  formatAmount,
  formatDateTime,
  formatFrequency,
  type Recurrence,
} from "@/lib/format"

/** Le socle commun aux dépenses et aux revenus, tels que les affiche le tableau. */
export interface TransactionRow extends Recurrence {
  id: number
  name: string
  amount: string | number
  start_date_time: string | null
  end_date_time: string | null
  account_name: string
}

interface TransactionColumnActions<T> {
  onEdit: (item: T) => void
  onDelete: (item: T) => void
  onManageExceptions: (item: T) => void
  /** Les dépenses s'affichent en rouge, les revenus en vert. */
  tone: "expense" | "income"
}

export function getTransactionColumns<T extends TransactionRow>({
  onEdit,
  onDelete,
  onManageExceptions,
  tone,
}: TransactionColumnActions<T>): ColumnDef<T>[] {
  return [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "account_name",
      header: "Account",
      cell: ({ row }) => row.getValue("account_name"),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span
          className={
            tone === "income"
              ? "text-brand-cyan font-medium"
              : "text-brand-pink font-medium"
          }
        >
          {tone === "income" ? "+" : "−"}
          {formatAmount(row.getValue("amount"))}
        </span>
      ),
    },
    {
      id: "frequency",
      header: "Frequency",
      cell: ({ row }) => formatFrequency(row.original),
    },
    {
      accessorKey: "start_date_time",
      header: "Start",
      cell: ({ row }) => formatDateTime(row.getValue("start_date_time")),
    },
    {
      accessorKey: "end_date_time",
      header: "End",
      cell: ({ row }) => formatDateTime(row.getValue("end_date_time")),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original

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
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageExceptions(item)}>
                <CalendarClock className="size-4" />
                Exceptions
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(item)}
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
