import { formatNumber, scaleEnergy } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { BessPerformance } from "../domain/overview";

interface Props {
  bess?: BessPerformance;
  loading?: boolean;
  className?: string;
}

const RING_SIZE = 112;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

// Cincin menunjukkan rasio discharge/charge (round-trip): busur tembaga =
// energi yang kembali dipakai, sisa cincin = rugi siklus.
export function BessPerformanceCard({ bess, loading, className }: Props) {
  const ratio = bess && bess.chargeKWh > 0 ? Math.min(1, bess.dischargeKWh / bess.chargeKWh) : 0;
  const charge = bess ? scaleEnergy(bess.chargeKWh) : undefined;
  const discharge = bess ? scaleEnergy(bess.dischargeKWh) : undefined;

  return (
    <aside className={cn("panel-metal w-56 rounded-lg px-4 py-3", className)} aria-label="BESS performance">
      <h2 className="mb-2 text-xs font-medium text-muted">BESS performance</h2>

      <div className="flex items-center gap-4">
        <svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`} role="img" aria-label={`Round-trip ${formatNumber(ratio * 100, 0)} persen`}>
          <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke="var(--color-border)" strokeWidth={RING_STROKE} />
          {bess && (
            <circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              fill="none"
              stroke="var(--color-copper)"
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={RING_LENGTH}
              strokeDashoffset={RING_LENGTH * (1 - ratio)}
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          )}
          <text x="50%" y="46%" textAnchor="middle" className="fill-text font-mono" fontSize="20" fontWeight="600">
            {bess ? `${formatNumber(ratio * 100, 0)}%` : "–"}
          </text>
          <text x="50%" y="64%" textAnchor="middle" className="fill-muted" fontSize="10">
            round-trip
          </text>
        </svg>

        <dl className="flex-1 space-y-3">
          <Readout label="Charge" value={charge} loading={loading} accent />
          <Readout label="Discharge" value={discharge} loading={loading} />
        </dl>
      </div>
    </aside>
  );
}

function Readout({ label, value, loading, accent }: { label: string; value?: { value: string; unit: string }; loading?: boolean; accent?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="mt-0.5 font-mono text-base font-semibold leading-tight">
        {loading || !value ? (
          <Skeleton className="h-5 w-20" />
        ) : (
          <>
            <span className={accent ? "text-copper" : undefined}>{value.value}</span>
            <span className="ml-1 text-xs font-medium text-muted">{value.unit}</span>
          </>
        )}
      </dd>
    </div>
  );
}
