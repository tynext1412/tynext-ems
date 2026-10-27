import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

type Variant = "primary" | "secondary" | "ghost";

// Hanya tombol utama yang memakai gradien merek (biru → teal); sisanya grafit.
const VARIANT_CLASS: Record<Variant, string> = {
  primary: "brand-fill font-semibold",
  secondary: "border border-border bg-surface-2 text-text hover:border-muted",
  ghost: "text-muted hover:bg-surface-2 hover:text-text",
};

export function Button({ variant = "secondary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-3.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASS[variant],
        className,
      )}
      {...props}
    />
  );
}
