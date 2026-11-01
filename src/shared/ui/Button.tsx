import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "danger" | "danger-soft";
export type ButtonSize = "sm" | "md" | "lg";

// Mengikuti varian Button di kit HeroUI: primary biru merek, secondary putih bertepi,
// tertiary abu-abu (tombol ikon di tabel), ghost tanpa latar.
const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-brand text-on-brand shadow-[inset_0_3px_2px_rgba(255,255,255,0.2)] hover:bg-brand-hover",
  secondary: "border border-border bg-surface text-text hover:bg-surface-2",
  tertiary: "bg-surface-3 text-text hover:bg-border",
  ghost: "text-muted hover:bg-surface-2 hover:text-text",
  danger: "bg-danger text-on-brand hover:brightness-95",
  "danger-soft": "bg-danger-soft text-danger-text hover:brightness-95",
};
const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-xs",
  md: "h-9 gap-2 px-3.5 text-sm",
  lg: "h-10 gap-2 px-4 text-sm",
};
const ICON_ONLY: Record<ButtonSize, string> = { sm: "size-8", md: "size-9", lg: "size-10" };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  loading?: boolean;
}

export function Button({ variant = "secondary", size = "md", iconOnly, loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        iconOnly ? cn(ICON_ONLY[size], "rounded-full px-0") : SIZE[size],
        VARIANT[variant],
        className,
      )}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
