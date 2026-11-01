import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type ChipTone = "neutral" | "ok" | "warn" | "danger" | "accent" | "brand";
export type ChipVariant = "solid" | "soft";
export type ChipSize = "sm" | "md" | "lg";

const SOLID: Record<ChipTone, string> = {
  neutral: "bg-surface-3 text-text",
  ok: "bg-ok text-white",
  warn: "bg-warn text-white",
  danger: "bg-danger text-white",
  accent: "bg-accent text-white",
  brand: "bg-brand text-white",
};
const SOFT: Record<ChipTone, string> = {
  neutral: "bg-surface-3 text-muted",
  ok: "bg-ok-soft text-ok-text",
  warn: "bg-warn-soft text-warn-text",
  danger: "bg-danger-soft text-danger-text",
  accent: "bg-accent-soft text-accent-strong",
  brand: "bg-brand-soft text-brand",
};
const DOT: Record<ChipTone, string> = { neutral: "bg-muted", ok: "bg-ok", warn: "bg-warn", danger: "bg-danger", accent: "bg-accent", brand: "bg-brand" };
const SIZE: Record<ChipSize, string> = { sm: "h-5 px-2 text-[11px]", md: "h-6 px-2.5 text-xs", lg: "h-7 px-3 text-sm" };

interface ChipProps {
  tone?: ChipTone;
  variant?: ChipVariant;
  size?: ChipSize;
  dot?: boolean; // titik warna di kiri (untuk varian soft/neutral)
  className?: string;
  children: ReactNode;
}

// Pill status/label (Chip di kit HeroUI). Solid untuk status utama di tabel, soft untuk label sekunder.
export function Chip({ tone = "neutral", variant = "solid", size = "md", dot, className, children }: ChipProps) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-medium leading-none", SIZE[size], variant === "solid" ? SOLID[tone] : SOFT[tone], className)}>
      {dot && <span className={cn("size-1.5 rounded-full", DOT[tone])} aria-hidden />}
      {children}
    </span>
  );
}

// Angka kecil di samping judul/tab (Badge di kit HeroUI).
export function CountBadge({ value, className }: { value: number | string; className?: string }) {
  return (
    <span className={cn("inline-grid h-5 min-w-4 place-items-center rounded-full bg-surface-3 px-1 font-mono text-xs font-medium leading-none text-text", className)}>
      {value}
    </span>
  );
}
