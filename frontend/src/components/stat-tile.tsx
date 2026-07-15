import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type Tone = "cyan" | "pink" | "gold"

/**
 * La teinte n'est pas décorative : elle code une famille de sens, la même partout dans
 * l'app. Cyan = solde et projection, pink = ce qui sort, gold = ce qui rapporte.
 */
const toneClasses: Record<Tone, { icon: string; glow: string; value: string }> = {
  cyan: {
    icon: "bg-brand-cyan/10 text-brand-cyan",
    glow: "from-brand-cyan/15",
    value: "text-brand-cyan",
  },
  pink: {
    icon: "bg-brand-pink/10 text-brand-pink",
    glow: "from-brand-pink/15",
    value: "text-brand-pink",
  },
  gold: {
    icon: "bg-brand-gold/10 text-brand-gold",
    glow: "from-brand-gold/15",
    value: "text-brand-gold",
  },
}

interface StatTileProps {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  tone: Tone
  /** Neutralise la couleur de la valeur (utile quand le chiffre est négatif). */
  muted?: boolean
  className?: string
}

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  muted,
  className,
}: StatTileProps) {
  const tones = toneClasses[tone]

  return (
    <div
      className={cn(
        "bg-card relative overflow-hidden rounded-2xl border p-5",
        className,
      )}
    >
      {/* Décoratif : ne doit jamais intercepter un clic. */}
      <div
        className={cn(
          "pointer-events-none absolute -top-16 -right-16 size-40 rounded-full",
          "bg-gradient-to-br to-transparent opacity-70 blur-2xl",
          tones.glow,
        )}
      />

      <div className="relative">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex size-8 items-center justify-center rounded-lg",
              tones.icon,
            )}
          >
            <Icon className="size-4" />
          </div>
          <p className="text-muted-foreground text-sm">{label}</p>
        </div>

        <p
          className={cn(
            "mt-3 text-2xl font-semibold tracking-tight tabular-nums",
            muted ? "text-destructive" : tones.value,
          )}
        >
          {value}
        </p>

        {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
      </div>
    </div>
  )
}
