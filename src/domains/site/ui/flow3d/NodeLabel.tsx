import type { Ref } from "react";
import { cn } from "@/shared/lib/cn";

interface Props {
  ref: Ref<HTMLDivElement>;
  label: string;
  value: string;
  caption?: string;
  color: string;
  active: boolean;
}

// Label DOM di atas objek (titik bawah label = ujung garis penunjuk); posisinya ditulis LabelProjector.
// Sumber yang sedang 0 kW tampil ringkas dan redup supaya tidak bersaing dengan yang aktif;
// arahkan kursor untuk melihat detailnya.
export function NodeLabel({ ref, label, value, caption, color, active }: Props) {
  return (
    <div ref={ref} className="group pointer-events-auto absolute left-0 top-0 w-max will-change-transform" style={{ transform: "translate(-50%, -100%)" }}>
      <div
        className={cn("rounded-lg border bg-surface/95 text-center shadow-surface transition-[padding,opacity] duration-150", active ? "px-2 py-1" : "px-1.5 py-0.5 opacity-80 group-hover:px-2 group-hover:py-1 group-hover:opacity-100")}
        style={{ borderColor: active ? color : "var(--color-border)" }}
      >
        <div className="flex items-center justify-center gap-1.5 text-[10px] leading-tight text-muted">
          <span className="size-1.5 rounded-full" style={{ background: active ? color : "var(--color-muted)" }} aria-hidden />
          {label}
          {!active && <span className="group-hover:hidden">· {caption ?? value}</span>}
        </div>
        <div className={cn("font-mono text-sm font-semibold leading-tight text-text", !active && "hidden group-hover:block")}>{value}</div>
        {caption && <div className={cn("text-[10px] leading-tight text-muted", !active && "hidden group-hover:block")}>{caption}</div>}
      </div>
    </div>
  );
}
