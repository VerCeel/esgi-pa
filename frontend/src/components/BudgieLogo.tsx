import { cn } from "@/lib/utils"

interface BudgieLogoProps {
  className?: string
}

/**
 * La perruche verte — le même oiseau que le favicon (public/favicon.svg),
 * pour que l'identité soit cohérente entre l'onglet du navigateur et la navbar.
 */
export function BudgieLogo({ className }: BudgieLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#22c55e"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Budgie"
      className={cn("size-6", className)}
    >
      <path d="M16 7h.01" />
      <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
      <path d="m20 7 2 .5-2 .5" />
      <path d="M10 18v3" />
      <path d="M14 17.75V21" />
      <path d="M7 18a6 6 0 0 0 3.84-10.61" />
    </svg>
  )
}
