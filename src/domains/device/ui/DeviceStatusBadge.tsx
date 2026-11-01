import { Chip, type ChipSize, type ChipTone } from "@/shared/ui/Chip";
import { DEVICE_STATUS_LABEL, type DeviceStatus } from "../domain/device";

const TONE: Record<DeviceStatus, ChipTone> = { ONLINE: "ok", ALARM: "warn", OFFLINE: "danger" };

// Pill status perangkat: hijau Online, oranye Alarm, merah Offline (sama dengan status plant).
export function DeviceStatusBadge({ status, size = "md", className }: { status: DeviceStatus; size?: ChipSize; className?: string }) {
  return (
    <Chip tone={TONE[status]} size={size} className={className}>
      {DEVICE_STATUS_LABEL[status]}
    </Chip>
  );
}
