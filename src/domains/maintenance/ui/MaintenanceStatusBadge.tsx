import { cn } from "@/shared/lib/cn";
import { MAINTENANCE_STATUS_LABEL, type MaintenanceStatus } from "../domain/maintenance";

const TEXT: Record<MaintenanceStatus, string> = { DONE: "text-ok", PENDING: "text-warn", UPCOMING: "text-accent" };
const DOT: Record<MaintenanceStatus, string> = { DONE: "bg-ok", PENDING: "bg-warn", UPCOMING: "bg-accent" };

export function MaintenanceStatusBadge({ status, className }: { status: MaintenanceStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-medium", TEXT[status], className)}>
      <span className={cn("size-2 rounded-full", DOT[status])} aria-hidden />
      {MAINTENANCE_STATUS_LABEL[status]}
    </span>
  );
}
