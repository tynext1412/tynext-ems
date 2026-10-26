import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

const FIELD_CLASS =
  "h-10 rounded-md border border-border bg-bg px-3 text-sm text-text placeholder:text-muted focus:border-copper focus:outline-none";

// ComponentProps menyertakan `ref` (React 19), jadi field bisa difokuskan dari luar.
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(FIELD_CLASS, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(FIELD_CLASS, "pr-8", className)} {...props} />;
}
