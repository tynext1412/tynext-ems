import { CalendarDays, ChartLine, CircleDollarSign, Clock, Cog, Sun, Zap } from "lucide-react";
import type { ReactNode } from "react";
import chargeIcon from "@/assets/figma/icons/icon-charge.svg";
import dischargeIcon from "@/assets/figma/icons/icon-discharge.svg";
import { useOperatingData } from "@/domains/performance/application/use-performances";
import { GRANULARITIES, type Period } from "@/domains/performance/domain/performance";
import type { Plant } from "@/domains/plant/domain/plant";
import { toDateKey } from "@/shared/domain/time";
import { formatNumber, scaleEnergy, scaleIDR } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Card, Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { PeriodControl } from "./PeriodControl";

interface Props {
  plant: Plant;
  period: Period;
  onPeriodChange: (period: Period) => void;
}

// Field mengikuti spesifikasi "Operating Data": 2 baris × 4 kartu, ikon berwarna di tiap label.
export function OperatingDataPanel({ plant, period, onPeriodChange }: Props) {
  const today = toDateKey(new Date(), plant.location.timezone);
  const { data, isPending, isFetching, error, refetch } = useOperatingData({ plantId: plant.id, ...period });

  const pv = data ? scaleEnergy(data.pvProductionKWh) : undefined;
  const load = data ? scaleEnergy(data.loadConsumptionKWh) : undefined;
  const revenue = data ? scaleIDR(data.revenueIDR) : undefined;
  const hasGenerator = data !== undefined && data.dieselGeneratorKWh > 0;

  return (
    <Panel
      icon={<ChartLine />}
      title="Operating Data"
      actions={<PeriodControl period={period} onChange={onPeriodChange} granularities={GRANULARITIES} minDate={plant.commissionedAt} today={today} />}
      cards
    >
      {error && (
        <Alert
          tone="danger"
          action={
            <Button size="sm" variant="tertiary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        >
          Operating data tidak bisa dimuat: {error.message}.
        </Alert>
      )}

      <div className={cn("grid gap-1.5 sm:grid-cols-2 lg:grid-cols-4", isFetching && !isPending && "opacity-60 transition-opacity")} aria-busy={isFetching}>
        <Tile icon={<Sun className="text-warn" />} label="PV Production" value={pv?.value} unit={pv?.unit} loading={isPending} />
        <Tile icon={<img src={chargeIcon} alt="" />} label="BESS Charge" value={data && formatNumber(data.bessChargeKWh, 0)} unit="kWh" loading={isPending} />
        <Tile icon={<img src={dischargeIcon} alt="" />} label="BESS Discharge" value={data && formatNumber(data.bessDischargeKWh, 0)} unit="kWh" loading={isPending} />
        <Tile icon={<Cog className="text-muted" />} label="Diesel Generator" value={hasGenerator ? formatNumber(data.dieselGeneratorKWh, 0) : undefined} unit="kWh" loading={isPending} placeholder="Not Installed" />
        <Tile icon={<Zap className="fill-warn text-warn" />} label="Load Consumption" value={load?.value} unit={load?.unit} loading={isPending} />
        <Tile icon={<CalendarDays className="text-brand" />} label="Daily Operation" value={data && formatNumber(data.dayOperation, 0)} unit="day" loading={isPending} />
        <Tile icon={<Clock className="text-brand" />} label="Hours Operation" value={data && formatNumber(data.hoursOperation, 1)} unit="h" loading={isPending} />
        <Tile icon={<CircleDollarSign className="text-ok" />} label="Revenue" value={revenue && `Rp ${revenue.value}`} unit={revenue?.unit || undefined} loading={isPending} />
      </div>
    </Panel>
  );
}

function Tile({ icon, label, value, unit, loading, placeholder }: { icon: ReactNode; label: string; value?: string; unit?: string; loading?: boolean; placeholder?: string }) {
  return (
    <Card className="flex h-20 flex-col justify-center gap-1 rounded-xl py-0">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <span className="inline-flex size-4 shrink-0 items-center justify-center [&>img]:size-4 [&>svg]:size-4">{icon}</span>
        {label}
      </div>
      {loading ? (
        <Skeleton className="h-7 w-24" />
      ) : value === undefined ? (
        <div className="text-sm leading-8 text-muted">{placeholder ?? "–"}</div>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl font-semibold leading-8 text-text">{value}</span>
          {unit && <span className="text-sm text-muted">{unit}</span>}
        </div>
      )}
    </Card>
  );
}
