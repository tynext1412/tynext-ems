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

// Label DOM di atas kanvas; posisinya ditulis LabelProjector tiap frame (proyeksi titik 3D).
export function NodeLabel({ ref, label, value, caption, color, active }: Props) {
  return (
    <div ref={ref} className="absolute left-0 top-0 w-max will-change-transform" style={{ transform: "translate(-50%, -50%)" }}>
      <div className="rounded-lg border bg-surface/95 px-2 py-1 text-center shadow-surface" style={{ borderColor: active ? color : "var(--color-border)" }}>
        <div className="flex items-center justify-center gap-1.5 text-[10px] leading-tight text-muted">
          <span className="size-1.5 rounded-full" style={{ background: color }} aria-hidden />
          {label}
        </div>
        <div className={cn("font-mono text-sm font-semibold leading-tight", active ? "text-text" : "text-muted")}>{value}</div>
        {caption && <div className="text-[10px] leading-tight text-muted">{caption}</div>}
      </div>
    </div>
  );
}
