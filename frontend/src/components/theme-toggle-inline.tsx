import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Switch } from "@/components/ui/switch"

export function ThemeToggleInline() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <div className="flex items-center justify-between gap-2 px-2 py-1.5">
      <span className="flex items-center gap-2 text-sm">
        {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        Theme
      </span>
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Toggle dark mode"
      />
    </div>
  )
}
