import { cn } from "@/shared/lib/cn";
import { DEVICE_STATUS_LABEL, type DeviceStatus } from "../domain/device";

const TEXT: Record<DeviceStatus, string> = { ONLINE: "text-ok", ALARM: "text-warn", OFFLINE: "text-danger" };
const DOT: Record<DeviceStatus, string> = { ONLINE: "bg-ok", ALARM: "bg-warn", OFFLINE: "bg-danger" };

export function DeviceStatusBadge({ status, className }: { status: DeviceStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-medium", TEXT[status], className)}>
      <span className={cn("size-2 rounded-full", DOT[status])} aria-hidden />
      {DEVICE_STATUS_LABEL[status]}
    </span>
  );
}
