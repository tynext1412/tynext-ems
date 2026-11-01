import { CalendarCheck } from "lucide-react";
import type { Plant } from "@/domains/plant/domain/plant";
import { Card } from "@/shared/ui/Panel";
import { formatShortDate, formatShortDateTime } from "./format";

// Empat tonggak waktu plant dalam satu garis putus-putus: dibuat, terhubung grid, commissioning, terhubung platform.
export function KeyDates({ plant }: { plant: Plant }) {
  const tz = plant.location.timezone;
  const milestones = [
    { label: "Plant Created", value: formatShortDateTime(plant.createdAt, tz) },
    { label: "Grid Connection", value: formatShortDate(plant.gridConnectedAt) },
    { label: "Commissioning", value: formatShortDate(plant.commissionedAt) },
    { label: "Platform Connection", value: formatShortDate(plant.platformConnectedAt) },
  ];

  return (
    <Card className="p-5">
      <ol className="relative grid grid-cols-2 gap-x-10 gap-y-6 md:grid-cols-4">
        <span className="pointer-events-none absolute left-3 right-3 top-3 hidden border-t border-dashed border-border md:block" aria-hidden />
        {milestones.map((m) => (
          <li key={m.label} className="relative flex flex-col gap-3">
            <span className="relative inline-grid size-6 place-items-center rounded-full bg-surface text-brand">
              <CalendarCheck className="size-5" aria-hidden />
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-surface bg-ok" aria-hidden />
            </span>
            <div className="grid gap-1">
              <div className="text-xs text-muted">{m.label}</div>
              <div className="text-sm font-medium text-text">{m.value}</div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
