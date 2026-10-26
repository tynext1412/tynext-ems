import { formatNumber } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { EnvironmentalImpact } from "../domain/impact";

interface Props {
  impact?: EnvironmentalImpact;
  loading?: boolean;
  className?: string;
}

// Tiga readout bertumpuk, tanpa ikon: angkanya yang jadi informasi.
export function EnvironmentalBenefitsPanel({ impact, loading, className }: Props) {
  return (
    <aside className={cn("panel-metal w-52 rounded-lg px-4 py-3", className)} aria-label="Environmental Benefits">
      <h2 className="mb-1 text-xs font-medium text-muted">Environmental Benefits</h2>
      <dl className="divide-y divide-border">
        <Readout label="Equivalent trees" value={impact && formatNumber(impact.equivalentTrees, 0)} unit="pohon" loading={loading} />
        <Readout label="CO₂ reduction" value={impact && formatNumber(impact.co2ReductionTon, 2)} unit="t" loading={loading} />
        <Readout label="Coal saved" value={impact && formatNumber(impact.coalSavedTon, 2)} unit="t" loading={loading} />
      </dl>
    </aside>
  );
}

function Readout({ label, value, unit, loading }: { label: string; value?: string; unit: string; loading?: boolean }) {
  return (
    <div className="py-2.5">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="mt-0.5">
        {loading || value === undefined ? (
          <Skeleton className="h-5 w-24" />
        ) : (
          <span className="font-mono text-base font-semibold">
            {value} <span className="text-xs font-medium text-muted">{unit}</span>
          </span>
        )}
      </dd>
    </div>
  );
}
