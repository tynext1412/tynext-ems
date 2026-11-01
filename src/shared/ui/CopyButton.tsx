import { Check, Copy } from "lucide-react";
import { useCopy } from "@/shared/lib/clipboard";
import { cn } from "@/shared/lib/cn";

// Ikon salin di samping email/serial number; berubah jadi centang sebentar setelah disalin.
export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const { copied, copy } = useCopy();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void copy(value);
      }}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      title={copied ? "Copied" : `Copy ${label}`}
      className={cn("inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted hover:bg-surface-3 hover:text-text", className)}
    >
      {copied ? <Check className="size-3.5 text-ok-text" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
    </button>
  );
}
