import { cn } from "@/lib/utils"

interface BudgieLogoProps {
  className?: string
}

/**
 * Une pièce de monnaie frappée d'un « B ».
 *
 * Le dégradé (cyan → pink → gold) est déclaré avec un identifiant fixe : si le logo
 * apparaît deux fois sur la page, les deux <defs> portent le même id et le navigateur
 * réutilise simplement le premier — c'est sans conséquence puisque la définition est
 * identique partout.
 */
export function BudgieLogo({ className }: BudgieLogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="Budgie"
      className={cn("size-6", className)}
    >
      <defs>
        <linearGradient id="budgie-coin" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="var(--brand-cyan)" />
          <stop offset="50%" stopColor="var(--brand-pink)" />
          <stop offset="100%" stopColor="var(--brand-gold)" />
        </linearGradient>
      </defs>

      {/* La tranche de la pièce. */}
      <circle cx="16" cy="16" r="14" fill="url(#budgie-coin)" />
      {/* Le méplat intérieur, qui donne le relief d'une pièce frappée. */}
      <circle
        cx="16"
        cy="16"
        r="11"
        stroke="var(--background)"
        strokeOpacity="0.45"
        strokeWidth="1.5"
      />
      <path
        d="M12.6 10.4h4.6c2.1 0 3.4 1 3.4 2.7 0 1.2-.7 2.1-1.8 2.5 1.4.3 2.3 1.3 2.3 2.8 0 1.9-1.4 3.2-3.8 3.2h-4.7V10.4Zm4.2 4.5c1 0 1.6-.5 1.6-1.3s-.6-1.3-1.6-1.3h-2v2.6h2Zm.3 4.9c1.1 0 1.8-.5 1.8-1.4s-.7-1.4-1.8-1.4h-2.3v2.8h2.3Z"
        fill="var(--background)"
      />
    </svg>
  )
}
