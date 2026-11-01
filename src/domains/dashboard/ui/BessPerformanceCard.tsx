import { Zap } from "lucide-react";
import chargeIcon from "@/assets/figma/icons/icon-charge.svg";
import dischargeIcon from "@/assets/figma/icons/icon-discharge.svg";
import { formatNumber, scaleEnergy } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Card, Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { roundTripEfficiency, type BessPerformance } from "../domain/overview";

interface Props {
  bess?: BessPerformance;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  inset?: 4 | 6; // jarak tepi panel ke kartu (4 di Home, 6 di halaman site)
  className?: string;
}

const RING = 60;
const STROKE = 6;
const R = (RING - STROKE) / 2;
const LEN = 2 * Math.PI * R;

// Panel BESS Performance: gauge efisiensi round-trip, lalu kartu Charge (hijau) dan Discharge (merah).
export function BessPerformanceCard({ bess, loading, error, onRetry, inset, className }: Props) {
  const ratio = bess ? roundTripEfficiency(bess) : 0;
  const charge = bess ? scaleEnergy(bess.chargeKWh) : undefined;
  const discharge = bess ? scaleEnergy(bess.dischargeKWh) : undefined;

  return (
    <Panel icon={<Zap className="fill-warn text-warn" />} title="BESS Performance" cards inset={inset} className={cn(className)} aria-label="BESS performance">
      {error ? (
        <Card className="flex items-center justify-between gap-3">
          <span className="text-sm text-danger-text">Couldn't load</span>
          <Button size="sm" variant="tertiary" onClick={onRetry}>
            Retry
          </Button>
        </Card>
      ) : (
        <>
          <Card className="flex h-[88px] items-center gap-3 py-3.5 pl-4 pr-3">
            <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} role="img" aria-label={`Round-trip ${formatNumber(ratio * 100, 0)} persen`} className="shrink-0">
              <circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke="#e9ecef" strokeWidth={STROKE} />
              {bess && <circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke="var(--color-ok)" strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={LEN} strokeDashoffset={LEN * (1 - ratio)} transform={`rotate(-90 ${RING / 2} ${RING / 2})`} />}
              <text x="50%" y="50%" dy="0.35em" textAnchor="middle" className="fill-text font-mono" fontSize="16" fontWeight="600">
                {loading || !bess ? "–" : `${formatNumber(ratio * 100, 0)}%`}
              </text>
            </svg>
            <div className="min-w-0">
              <div className="text-sm font-medium text-text">Round-trip Efficiency</div>
              <div className="text-xs text-muted">Energy output vs. input</div>
            </div>
          </Card>
          <div className="grid grid-cols-2 gap-1">
            <Metric label="Charge" icon={chargeIcon} value={charge} loading={loading} tone="text-ok" />
            <Metric label="Discharge" icon={dischargeIcon} value={discharge} loading={loading} tone="text-danger" />
          </div>
        </>
      )}
    </Panel>
  );
}

function Metric({ label, icon, value, loading, tone }: { label: string; icon: string; value?: { value: string; unit: string }; loading?: boolean; tone: string }) {
  return (
    <Card className="h-[88px] p-3">
      <div className="flex items-center gap-1 text-xs leading-5 text-muted">
        <img src={icon} alt="" className="size-4" />
        {label}
      </div>
      {loading || !value ? (
        <Skeleton className="mt-4 h-6 w-24" />
      ) : (
        <div className="mt-4 flex items-baseline gap-1.5 whitespace-nowrap">
          <span className={cn("font-mono text-lg font-semibold leading-7", tone)}>{value.value}</span>
          <span className="text-sm leading-6 text-muted">{value.unit}</span>
        </div>
      )}
    </Card>
  );
}
