import { BATTERY_STATUS_LABEL, batteryStatus, type PowerSnapshot } from "@/domains/telemetry/domain/power-snapshot";
import { formatKW, formatKWh } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";

interface Props {
  snapshot: PowerSnapshot | null | undefined;
  batteryKWh: number;
}

const SEGMENTS = 10;

export function BatterySocCard({ snapshot, batteryKWh }: Props) {
  if (batteryKWh <= 0) {
    return (
      <Panel title="Battery">
        <p className="text-sm text-muted">Plant ini tidak memiliki BESS.</p>
      </Panel>
    );
  }

  const status = snapshot ? batteryStatus(snapshot.batteryKW) : undefined;
  const filled = snapshot ? Math.round((snapshot.socPercent / 100) * SEGMENTS) : 0;

  return (
    <Panel title="Battery">
      {snapshot ? (
        <>
          <div className="flex items-center gap-3">
            <div className="flex flex-1 gap-1" role="img" aria-label={`State of charge ${snapshot.socPercent} persen`}>
              {Array.from({ length: SEGMENTS }, (_, i) => (
                <span key={i} className={cn("h-7 flex-1 rounded-sm", i < filled ? "bg-ok" : "bg-surface-2")} />
              ))}
            </div>
            <span className="font-mono text-xl font-semibold">{snapshot.socPercent}%</span>
          </div>
          <p className="mt-3 text-sm text-muted">
            {status && BATTERY_STATUS_LABEL[status]}
            {status !== "IDLE" && <span className="font-mono text-text"> {formatKW(Math.abs(snapshot.batteryKW), 1)}</span>}
            {" · "}kapasitas <span className="font-mono text-text">{formatKWh(batteryKWh, 0)}</span>
          </p>
        </>
      ) : (
        <Skeleton className="h-7 w-full" />
      )}
    </Panel>
  );
}
