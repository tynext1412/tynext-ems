import { CalendarDays, Wrench } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { MAINTENANCE_TYPE_LABEL, type MaintenanceType } from "../domain/maintenance";

const ICON: Record<MaintenanceType, typeof CalendarDays> = { REGULAR: CalendarDays, CORRECTIVE: Wrench };

// Ikon + label tipe pemeliharaan: kalender untuk Regular, kunci pas untuk Corrective.
export function MaintenanceTypeTag({ type, className }: { type: MaintenanceType; className?: string }) {
  const Icon = ICON[type];
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm text-text", className)}>
      <Icon className="size-4 shrink-0 text-accent" aria-hidden />
      {MAINTENANCE_TYPE_LABEL[type]}
    </span>
  );
}
