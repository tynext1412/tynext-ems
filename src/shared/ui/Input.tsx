import type { ComponentProps } from "react";
import { cn } from "@/shared/lib/cn";

const FIELD_CLASS =
  "h-10 rounded-md border border-border bg-bg px-3 text-sm text-text placeholder:text-muted focus:border-accent focus:outline-none";

// ComponentProps menyertakan `ref` (React 19), jadi field bisa difokuskan dari luar.
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(FIELD_CLASS, className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(FIELD_CLASS, "pr-8", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(FIELD_CLASS, "h-auto min-h-24 py-2 leading-relaxed", className)} {...props} />;
}
