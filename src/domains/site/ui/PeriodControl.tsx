import { CalendarDays, ChevronDown } from "lucide-react";
import { GRANULARITY_LABEL, type Granularity, type Period } from "@/domains/performance/domain/performance";
import { parseDateKey } from "@/shared/domain/time";
import { Tabs } from "@/shared/ui/Tabs";

interface Props {
  period: Period;
  onChange: (period: Period) => void;
  granularities: readonly Granularity[];
  minDate: string; // commissioning plant
  today: string;
}

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "short", year: "numeric" });

function chipLabel({ granularity, date }: Period): string {
  if (granularity === "day") return DAY_LABEL.format(parseDateKey(date));
  if (granularity === "month") return MONTH_LABEL.format(parseDateKey(date));
  return date.slice(0, 4);
}

// Kontrol periode seperti di desain: chip tanggal (ikon kalender, tanggal, panah) yang membuka
// pemilih tanggal bawaan browser, dan tab segmen Day/Month/Year/Lifetime.
export function PeriodControl({ period, onChange, granularities, minDate, today }: Props) {
  const inputType = period.granularity === "day" ? "date" : period.granularity === "month" ? "month" : undefined;
  const inputValue = period.granularity === "month" ? period.date.slice(0, 7) : period.date;

  const pick = (raw: string) => {
    if (!raw) return;
    const date = period.granularity === "month" ? `${raw}-01` : raw;
    if (date < minDate.slice(0, date.length) || date > today) return;
    onChange({ granularity: period.granularity, date });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {period.granularity !== "lifetime" && (
        <div className="flex items-center gap-0.5">
          <span className="relative inline-flex h-9 items-center gap-2 rounded-[10px] bg-surface px-2.5 text-sm text-text shadow-surface" aria-live="polite">
            <CalendarDays className="size-4 text-muted" aria-hidden />
            <span className="font-mono">{chipLabel(period)}</span>
            <ChevronDown className="size-4 text-muted" aria-hidden />
            {inputType && (
              <input
                type={inputType}
                value={inputValue}
                min={period.granularity === "month" ? minDate.slice(0, 7) : minDate}
                max={period.granularity === "month" ? today.slice(0, 7) : today}
                onChange={(e) => pick(e.target.value)}
                aria-label="Pilih periode"
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            )}
          </span>
        </div>
      )}
      <Tabs
        variant="segmented"
        aria-label="Granularitas periode"
        items={granularities.map((g) => ({ value: g, label: GRANULARITY_LABEL[g] }))}
        value={period.granularity}
        onChange={(g) => onChange({ granularity: g, date: today })}
      />
    </div>
  );
}
