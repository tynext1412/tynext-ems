import mark from "@/assets/tynext-mark.png";
import wordmarkNavy from "@/assets/tynext-wordmark-navy.png";
import wordmarkWhite from "@/assets/tynext-wordmark-white.png";
import { cn } from "@/shared/lib/cn";
import { useTheme } from "@/shared/lib/theme";

interface Props {
  className?: string;
  size?: "sm" | "md";
  tone?: "navy" | "white"; // wordmark navy untuk latar terang, putih untuk gelap; default mengikuti tema
}

// Logo resmi Tynext: mark bergradien + wordmark (navy di latar terang, putih di latar gelap).
export function Brand({ className, size = "sm", tone }: Props) {
  const theme = useTheme();
  const wordmark = (tone ?? (theme === "dark" ? "white" : "navy")) === "navy" ? wordmarkNavy : wordmarkWhite;
  const markClass = size === "md" ? "h-9" : "h-7";
  const wordClass = size === "md" ? "h-5" : "h-4";

  return (
    <span className={cn("flex items-center gap-2", className)}>
      <img src={mark} alt="" className={cn("w-auto", markClass)} />
      <img src={wordmark} alt="Tynext, Energy and Control" className={cn("w-auto", wordClass)} />
    </span>
  );
}
