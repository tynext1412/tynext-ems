import { Chip, type ChipSize } from "@/shared/ui/Chip";
import { PLANT_STATUS_LABEL, type PlantStatus } from "../domain/plant";
import { STATUS_TONE } from "./status-color";

// Pill status plant: hijau Online, oranye Alarm, merah Offline (Chip solid di desain).
export function PlantStatusBadge({ status, size = "md", className }: { status: PlantStatus; size?: ChipSize; className?: string }) {
  return (
    <Chip tone={STATUS_TONE[status]} size={size} className={className}>
      {PLANT_STATUS_LABEL[status]}
    </Chip>
  );
}
