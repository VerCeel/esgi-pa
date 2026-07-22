import Aurora from "@/components/react-bits/Aurora"

/**
 * Fond aurora commun à toutes les pages hors landing (dont le hero intègre déjà
 * le sien). Fixé au viewport et fondu vers le fond du thème pour que le contenu
 * reste lisible par-dessus.
 */
export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[70vh] overflow-hidden"
    >
      <Aurora
        colorStops={["#22d3ee", "#ec4899", "#f5b301"]}
        amplitude={1.1}
        blend={0.55}
        className="size-full"
      />
      <div className="from-background/70 via-background/50 to-background absolute inset-0 bg-gradient-to-b" />
    </div>
  )
}
