import logo from "@/assets/figma/logo/tynext-logo-color.svg";
import mark from "@/assets/tynext-mark.png";
import wordmarkWhite from "@/assets/tynext-wordmark-white.png";
import { cn } from "@/shared/lib/cn";
import { useTheme } from "@/shared/lib/theme";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Hanya mark (tanpa wordmark), untuk layar sempit. */
  compact?: boolean;
}

const HEIGHT = { sm: "h-7", md: "h-8", lg: "h-10" } as const;

// Logo resmi Tynext: SVG berwarna dari Figma di latar terang; di tema gelap wordmark navy tidak
// terbaca, jadi dipakai versi logo putih (PNG lama, sudah termasuk mark). Compact = mark saja.
export function Brand({ className, size = "md", compact }: Props) {
  const theme = useTheme();
  if (compact) return <img src={mark} alt="Tynext" className={cn("w-auto", HEIGHT[size], className)} />;
  if (theme === "dark") return <img src={wordmarkWhite} alt="Tynext, Energy and Control" className={cn("w-auto", HEIGHT[size], className)} />;
  return <img src={logo} alt="Tynext, Energy and Control" className={cn("w-auto", HEIGHT[size], className)} />;
}
