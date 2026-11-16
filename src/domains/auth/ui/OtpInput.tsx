import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/shared/lib/cn";
import { RESET_CODE_LENGTH, sanitizeCode } from "../domain/password-reset";

interface Props {
  digits: string[]; // panjang 6, "" = kotak kosong
  onChange: (digits: string[]) => void;
  invalid?: boolean;
  disabled?: boolean; // memproses atau terkunci: kotak abu-abu
  autoFocus?: boolean;
  labelledBy?: string;
  describedBy?: string;
}

// Enam kotak kode (Figma digit 60 × 56, jarak 8, radius 12). Fokus pindah otomatis ke kotak
// berikutnya; paste 6 digit mengisi semua kotak sekaligus; Backspace di kotak kosong mundur.
export function OtpInput({ digits, onChange, invalid, disabled, autoFocus, labelledBy, describedBy }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const focus = (i: number) => {
    const el = refs.current[Math.max(0, Math.min(RESET_CODE_LENGTH - 1, i))];
    el?.focus();
    el?.select();
  };

  // Isi mulai kotak `start` dengan beberapa digit (paste atau autofill one-time-code).
  const fill = (start: number, value: string) => {
    const from = value.length >= RESET_CODE_LENGTH ? 0 : start;
    const next = [...digits];
    value.split("").forEach((d, k) => {
      if (from + k < RESET_CODE_LENGTH) next[from + k] = d;
    });
    onChange(next);
    const firstEmpty = next.findIndex((d) => d === "");
    focus(firstEmpty === -1 ? RESET_CODE_LENGTH - 1 : firstEmpty);
  };

  const onInput = (i: number, raw: string) => {
    const typed = sanitizeCode(raw);
    if (typed.length > 1 && !(typed.length === 2 && digits[i])) return fill(i, typed);
    // Kotak yang sudah berisi lalu diketik lagi berisi dua digit: ambil yang baru.
    const digit = typed.length === 2 ? (typed[0] === digits[i] ? typed[1] : typed[0]) : typed;
    const next = [...digits];
    next[i] = digit;
    onChange(next);
    if (digit && i < RESET_CODE_LENGTH - 1) focus(i + 1);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      e.preventDefault();
      const next = [...digits];
      next[i - 1] = "";
      onChange(next);
      focus(i - 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(i + 1);
    }
  };

  const onPaste = (i: number, e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = sanitizeCode(e.clipboardData.getData("text"));
    e.preventDefault();
    if (pasted) fill(i, pasted);
  };

  return (
    <div role="group" aria-labelledby={labelledBy} aria-describedby={describedBy} className="flex gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={(e) => onPaste(i, e)}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of ${RESET_CODE_LENGTH}`}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-14 w-0 min-w-0 flex-1 rounded-xl border text-center font-mono text-[22px] font-semibold leading-7 text-text caret-brand outline-none! transition-colors",
            disabled
              ? "border-surface-3 bg-bg"
              : cn("bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:border-brand focus:shadow-[inset_0_0_0_1px_var(--color-brand),0_1px_2px_rgba(0,0,0,0.04)]", invalid ? "border-danger" : "border-border"),
          )}
        />
      ))}
    </div>
  );
}
