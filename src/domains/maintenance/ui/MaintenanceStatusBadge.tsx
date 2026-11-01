import { Chip, type ChipSize, type ChipTone, type ChipVariant } from "@/shared/ui/Chip";
import { MAINTENANCE_STATUS_LABEL, type MaintenanceStatus } from "../domain/maintenance";

// Upcoming = abu-abu lembut, Pending = oranye, Done = hijau (Chip di desain O&M).
const STYLE: Record<MaintenanceStatus, { tone: ChipTone; variant: ChipVariant }> = {
  UPCOMING: { tone: "neutral", variant: "soft" },
  PENDING: { tone: "warn", variant: "solid" },
  DONE: { tone: "ok", variant: "solid" },
};

export function MaintenanceStatusBadge({ status, size = "md", className }: { status: MaintenanceStatus; size?: ChipSize; className?: string }) {
  return (
    <Chip tone={STYLE[status].tone} variant={STYLE[status].variant} size={size} className={className}>
      {MAINTENANCE_STATUS_LABEL[status]}
    </Chip>
  );
}
