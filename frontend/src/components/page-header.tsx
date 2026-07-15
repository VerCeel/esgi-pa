import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  description: string
  /** Boutons alignés à droite (« New… », etc.). */
  actions?: ReactNode
}

/** En-tête commun à toutes les pages de l'app : même hiérarchie, mêmes espacements. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 text-pretty">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}
