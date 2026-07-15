import { useEffect, useState } from "react"

/**
 * Retarde la propagation d'une valeur. Sert au champ de recherche : sans ça, chaque
 * frappe déclencherait une requête au serveur.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debounced
}
