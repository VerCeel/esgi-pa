import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
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
  type ExpenseWithAccount,
} from "@/lib/expenses"

interface ExpenseColumnActions {
  onEdit: (expense: ExpenseWithAccount) => void
  onDelete: (expense: ExpenseWithAccount) => void
}

export function getExpenseColumns({
  onEdit,
  onDelete,
}: ExpenseColumnActions): ColumnDef<ExpenseWithAccount>[] {
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
      cell: ({ row }) => formatAmount(row.getValue("amount")),
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
        const expense = row.original

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
              <DropdownMenuItem onClick={() => onEdit(expense)}>
                <Pencil className="size-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(expense)}
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
