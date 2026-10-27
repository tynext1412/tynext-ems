import { Moon, Sun } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { setTheme, useTheme } from "@/shared/lib/theme";

// Sakelar tema: ikon menunjukkan tema yang akan dituju, label menyebut aksinya.
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={next === "dark" ? "Ganti ke tema gelap" : "Ganti ke tema terang"}
      title={next === "dark" ? "Tema gelap" : "Tema terang"}
      className={cn("inline-flex size-9 items-center justify-center rounded-md border border-border bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-text", className)}
    >
      {next === "dark" ? <Moon className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
    </button>
  );
}
