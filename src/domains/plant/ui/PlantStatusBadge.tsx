import { cn } from "@/shared/lib/cn";
import { PLANT_STATUS_LABEL, type PlantStatus } from "../domain/plant";
import { STATUS_COLOR } from "./status-color";

const STATUS_TEXT_CLASS: Record<PlantStatus, string> = {
  ONLINE: "text-ok",
  ALARM: "text-warn",
  OFFLINE: "text-danger",
};

export function PlantStatusBadge({ status, className }: { status: PlantStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-medium", STATUS_TEXT_CLASS[status], className)}>
      <span className="size-2 rounded-full" style={{ background: STATUS_COLOR[status] }} aria-hidden />
      {PLANT_STATUS_LABEL[status]}
    </span>
  );
}
