import { useOperatingData } from "@/domains/performance/application/use-performances";
import { GRANULARITIES, type Period } from "@/domains/performance/domain/performance";
import type { Plant } from "@/domains/plant/domain/plant";
import { toDateKey } from "@/shared/domain/time";
import { formatNumber, scaleEnergy, scaleIDR } from "@/shared/domain/units";
import { Button } from "@/shared/ui/Button";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { PeriodControl } from "./PeriodControl";

interface Props {
  plant: Plant;
  period: Period;
  onPeriodChange: (period: Period) => void;
}

// Field mengikuti spesifikasi "Operating Data".
export function OperatingDataPanel({ plant, period, onPeriodChange }: Props) {
  const today = toDateKey(new Date(), plant.location.timezone);
  const { data, isPending, isFetching, error, refetch } = useOperatingData({ plantId: plant.id, ...period });

  const pv = data ? scaleEnergy(data.pvProductionKWh) : undefined;
  const load = data ? scaleEnergy(data.loadConsumptionKWh) : undefined;
  const revenue = data ? scaleIDR(data.revenueIDR) : undefined;

  return (
    <Panel
      title="Operating Data"
      actions={<PeriodControl period={period} onChange={onPeriodChange} granularities={GRANULARITIES} minDate={plant.commissionedAt} today={today} />}
    >
      {error && (
        <div role="alert" className="mb-3 flex flex-wrap items-center gap-3 text-sm">
          <span>Operating data tidak bisa dimuat: {error.message}.</span>
          <Button onClick={() => void refetch()} className="h-9">
            Coba muat ulang
          </Button>
        </div>
      )}

      <div className={isFetching && !isPending ? "opacity-60 transition-opacity" : "transition-opacity"} aria-busy={isFetching}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="PV Production" value={pv?.value} unit={pv?.unit} loading={isPending} />
          <Tile label="BESS Charge" value={data && formatNumber(data.bessChargeKWh, 0)} unit="kWh" loading={isPending} />
          <Tile label="BESS Discharge" value={data && formatNumber(data.bessDischargeKWh, 0)} unit="kWh" loading={isPending} />
          <Tile label="Diesel Generator" value={data && formatNumber(data.dieselGeneratorKWh, 0)} unit="kWh" loading={isPending} note="tidak terpasang" />
          <Tile label="Load Consumption" value={load?.value} unit={load?.unit} loading={isPending} />
          <Tile label="Day Operation" value={data && formatNumber(data.dayOperation, 0)} unit="hari" loading={isPending} />
          <Tile label="Hours Operation" value={data && formatNumber(data.hoursOperation, 1)} unit="h" loading={isPending} />
          <Tile label="Revenue" value={revenue && `Rp ${revenue.value}`} unit={revenue?.unit} loading={isPending} />
        </div>
      </div>
    </Panel>
  );
}

function Tile({ label, value, unit, loading, note }: { label: string; value?: string; unit?: string; loading?: boolean; note?: string }) {
  return (
    <div className="rounded-md border border-border bg-bg px-4 py-3">
      {loading || value === undefined ? (
        <Skeleton className="h-6 w-24" />
      ) : (
        <div className="font-mono text-xl font-semibold leading-tight">
          {value}
          {unit && <span className="ml-1 text-xs font-medium text-muted">{unit}</span>}
        </div>
      )}
      <div className="mt-1 text-xs text-muted">
        {label}
        {note && <span className="ml-1">({note})</span>}
      </div>
    </div>
  );
}
