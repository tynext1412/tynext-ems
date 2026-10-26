import { ChevronLeft, ChevronRight } from "lucide-react";
import { GRANULARITY_LABEL, type Granularity, type Period } from "@/domains/performance/domain/performance";
import { Button } from "@/shared/ui/Button";
import { Tabs } from "@/shared/ui/Tabs";
import { canStepBack, canStepForward, periodLabel, stepPeriod } from "../domain/period";

interface Props {
  period: Period;
  onChange: (period: Period) => void;
  granularities: readonly Granularity[];
  minDate: string; // commissioning plant
  today: string;
}

// Satu baris kontrol periode: mundur/maju + tab granularitas. Dipakai Operating Data dan Grafik.
export function PeriodControl({ period, onChange, granularities, minDate, today }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {period.granularity !== "lifetime" && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" className="size-9 px-0" disabled={!canStepBack(period, minDate)} onClick={() => onChange(stepPeriod(period, -1))} aria-label="Periode sebelumnya">
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <span className="min-w-24 text-center font-mono text-sm" aria-live="polite">
            {periodLabel(period)}
          </span>
          <Button variant="ghost" className="size-9 px-0" disabled={!canStepForward(period, today)} onClick={() => onChange(stepPeriod(period, 1))} aria-label="Periode berikutnya">
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      )}
      <Tabs
        items={granularities.map((g) => ({ value: g, label: GRANULARITY_LABEL[g] }))}
        value={period.granularity}
        onChange={(g) => onChange({ granularity: g, date: today })}
        className="border-b-0"
      />
    </div>
  );
}
