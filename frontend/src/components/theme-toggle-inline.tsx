import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggleInline() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex gap-1 p-2">
      <Button
        type="button"
        variant={theme === "light" ? "secondary" : "ghost"}
        size="sm"
        className={cn("flex-1")}
        onClick={() => setTheme("light")}
      >
        <Sun className="size-4" />
        Light
      </Button>
      <Button
        type="button"
        variant={theme === "dark" ? "secondary" : "ghost"}
        size="sm"
        className={cn("flex-1")}
        onClick={() => setTheme("dark")}
      >
        <Moon className="size-4" />
        Dark
      </Button>
    </div>
  )
}
