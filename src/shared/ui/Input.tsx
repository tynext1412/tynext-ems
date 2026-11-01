import { ChevronDown, Search, X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

const FIELD_CLASS =
  "h-9 w-full rounded-xl border border-border bg-surface px-3 shadow-surface text-sm text-text placeholder:text-muted transition-colors hover:border-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger";

// ComponentProps menyertakan `ref` (React 19), jadi field bisa difokuskan dari luar.
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(FIELD_CLASS, className)} {...props} />;
}

export function Select({ className, wrapperClassName, ...props }: ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <span className={cn("relative inline-block", wrapperClassName)}>
      <select className={cn(FIELD_CLASS, "appearance-none pr-9", className)} {...props} />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
    </span>
  );
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(FIELD_CLASS, "h-auto min-h-24 py-2.5 leading-relaxed", className)} {...props} />;
}

export function Checkbox({ className, ...props }: ComponentProps<"input">) {
  return <input type="checkbox" className={cn("size-5 shrink-0 cursor-pointer rounded-md border-border accent-brand", className)} {...props} />;
}

interface SearchFieldProps extends Omit<ComponentProps<"input">, "value" | "onChange" | "onSubmit"> {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void; // Enter
  onClear?: () => void; // tombol × (bawaan: kosongkan nilai)
  wrapperClassName?: string;
}

// Kolom pencarian berbentuk pill dengan ikon kaca pembesar dan tombol × untuk mengosongkan.
export function SearchField({ value, onChange, onSubmit, onClear, className, wrapperClassName, ...props }: SearchFieldProps) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit?.();
        }}
        className={cn(FIELD_CLASS, "rounded-full pl-9 pr-9 [&::-webkit-search-cancel-button]:hidden", className)}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => (onClear ? onClear() : onChange(""))}
          aria-label="Kosongkan pencarian"
          className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-surface-3 hover:text-text"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

interface FieldProps {
  id: string;
  label: ReactNode;
  required?: boolean;
  hint?: ReactNode; // teks kanan (mis. 0/500)
  error?: string;
  children: ReactNode;
  className?: string;
}

// Label + kontrol + pesan galat, satu kolom.
export function Field({ id, label, required, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
          {required && (
            <span className="ml-0.5 text-danger" aria-hidden>
              *
            </span>
          )}
        </label>
        {hint && <span className="font-mono text-xs text-muted">{hint}</span>}
      </div>
      {children}
      <p id={`${id}-error`} className={cn("text-xs text-danger-text", !error && "sr-only")} aria-live="polite">
        {error}
      </p>
    </div>
  );
}
