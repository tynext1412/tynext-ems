import { BatteryMedium, Pause } from "lucide-react";
import chargeIcon from "@/assets/figma/icons/icon-charge.svg";
import dischargeIcon from "@/assets/figma/icons/icon-discharge.svg";
import { batteryStatus, type PowerSnapshot } from "@/domains/telemetry/domain/power-snapshot";
import { formatKWh, formatNumber } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Card, Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";

interface Props {
  snapshot: PowerSnapshot | null | undefined;
  batteryKWh: number;
}

const SEGMENTS = 10;

// Panel Battery: bar SOC 10 sel berbentuk baterai + persentase, kapasitas, lalu kartu charge/discharge.
const STATUS_WORD = { CHARGING: "Charge", DISCHARGING: "Discharge", IDLE: "Idle" } as const;

export function BatterySocCard({ snapshot, batteryKWh }: Props) {
  if (batteryKWh <= 0) {
    return (
      <Panel icon={<BatteryMedium />} title="Battery">
        <p className="text-sm text-muted">No BESS installed</p>
      </Panel>
    );
  }

  const status = snapshot ? batteryStatus(snapshot.batteryKW) : undefined;
  const filled = snapshot ? Math.round((snapshot.socPercent / 100) * SEGMENTS) : 0;

  return (
    <Panel icon={<BatteryMedium />} title="Battery" cards>
      {snapshot ? (
        <>
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center" role="img" aria-label={`State of charge ${snapshot.socPercent} persen`}>
                <div className="flex flex-1 gap-1 rounded-lg bg-bg p-2">
                  {Array.from({ length: SEGMENTS }, (_, i) => (
                    <span key={i} className={cn("h-7 flex-1 rounded", i < filled ? "bg-ok" : "bg-border")} />
                  ))}
                </div>
                <span className="h-6 w-1 rounded-r-lg bg-border" aria-hidden />
              </div>
              <span className="font-mono text-base font-semibold">{snapshot.socPercent}%</span>
            </div>
            <p className="mt-3 text-sm text-text">
              Capacity: <span className="font-medium">{formatKWh(batteryKWh, 0)}</span>
            </p>
          </Card>
          <Card className="flex items-center justify-between gap-3 py-3.5">
            <span className="flex items-center gap-1.5 text-sm text-muted">
              {status === "IDLE" ? <Pause className="size-4" aria-hidden /> : <img src={status === "CHARGING" ? chargeIcon : dischargeIcon} alt="" className="size-4" />}
              {status ? STATUS_WORD[status] : "–"}
            </span>
            <span className="flex items-baseline gap-1.5">
              <span className={cn("font-mono text-lg font-semibold", status === "CHARGING" ? "text-ok" : status === "DISCHARGING" ? "text-danger" : "text-muted")}>{formatNumber(Math.abs(snapshot.batteryKW), 1)}</span>
              <span className="text-sm text-muted">kW</span>
            </span>
          </Card>
        </>
      ) : (
        <Card>
          <Skeleton className="h-11 w-full" />
          <Skeleton className="mt-3 h-4 w-32" />
        </Card>
      )}
    </Panel>
  );
}
