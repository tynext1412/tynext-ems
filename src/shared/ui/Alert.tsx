import { AlertTriangle, CircleCheck, CircleX, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type AlertTone = "danger" | "warning" | "info" | "success";

const TONE: Record<AlertTone, { box: string; icon: typeof Info }> = {
  danger: { box: "bg-danger-soft text-danger-text", icon: CircleX },
  warning: { box: "bg-warn-soft text-warn-text", icon: AlertTriangle },
  info: { box: "bg-accent-soft text-accent-strong", icon: Info },
  success: { box: "bg-ok-soft text-ok-text", icon: CircleCheck },
};

interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

// Pesan sebaris (di dalam panel/drawer) dengan ikon dan aksi opsional.
export function Alert({ tone = "info", title, children, action, className }: AlertProps) {
  const Icon = TONE[tone].icon;
  return (
    <div role={tone === "danger" || tone === "warning" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-2xl px-4 py-3 text-sm", TONE[tone].box, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        {title && <div className="font-medium">{title}</div>}
        {children && <div className={cn(title && "mt-0.5 opacity-90")}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

// Pesan mengambang di tengah bawah layar (refresh gagal, offline).
export function Toast({ tone = "info", children, action, className }: Omit<AlertProps, "title">) {
  const Icon = TONE[tone].icon;
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn("pointer-events-auto flex max-w-[calc(100vw-32px)] items-center gap-3 rounded-2xl px-4 py-2.5 text-sm shadow-overlay", TONE[tone].box, className)}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="min-w-0">{children}</span>
      {action}
    </div>
  );
}
