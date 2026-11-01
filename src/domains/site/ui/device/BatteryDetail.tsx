import type { BatteryRecord } from "@/domains/device/domain/device";
import type { BatteryReading } from "@/domains/device/domain/reading";
import type { Plant } from "@/domains/plant/domain/plant";
import type { ReactNode } from "react";
import { formatDateKey } from "@/shared/domain/time";
import { formatNumber, scaleEnergy } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Field, InfoGrid, MeasureTable, PlantLink, Stat } from "./detail-shared";

interface Props {
  device: BatteryRecord;
  reading?: BatteryReading;
  loading: boolean;
  plant: Plant;
  photo?: ReactNode; // kartu foto di samping informasi perangkat
}

const STATUS_LABEL = { CHARGING: "Charging", DISCHARGING: "Discharging", IDLE: "Idle" } as const;
const STATUS_CLASS = { CHARGING: "text-ok-text", DISCHARGING: "text-warn-text", IDLE: "text-muted" } as const;

const RING = 96;
const STROKE = 8;
const R = (RING - STROKE) / 2;
const LEN = 2 * Math.PI * R;

export function BatteryDetail({ device, reading, loading, plant, photo }: Props) {
  const e = (kWh?: number) => {
    if (kWh === undefined) return "";
    const s = scaleEnergy(kWh);
    return `${s.value} ${s.unit}`;
  };

  return (
    <>
      <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
        {photo}
        <Panel title="Device Information">
          <InfoGrid>
            <Field label="Model">{device.model}</Field>
            <Field label="Type">{device.batteryType}</Field>
            <Field label="Capacity" mono>{formatNumber(device.capacityKWh, 0)} kWh</Field>
            <Field label="Plant"><PlantLink plantId={plant.id} name={plant.name} /></Field>
            <Field label="Associated Datalogger" mono>{device.dataloggerId}</Field>
            <Field label="Commissioning Date" mono>{formatDateKey(device.commissionedAt)}</Field>
            <Field label="Max Charge Current (BMS)" mono>{device.maxChargeCurrentA} A</Field>
            <Field label="Max Discharge Current (BMS)" mono>{device.maxDischargeCurrentA} A</Field>
            <Field label="Battery Packs" mono>{device.packCount}</Field>
            <Field label="Modules in Series" mono>{device.modulesInSeries}</Field>
            <Field label="Parallel Connections" mono>{device.parallelConnections}</Field>
            <Field label="Number of Cycles" mono>{reading ? formatNumber(reading.cycleCount, 0) : loading ? "…" : "–"}</Field>
            <Field label="Address" mono>{device.address}</Field>
            <Field label="Firmware Version" mono>{device.firmwareVersion}</Field>
            <Field label="Vendor">{device.vendor}</Field>
          </InfoGrid>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Real-time Data">
          <div className="flex flex-wrap items-center gap-6">
            <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} role="img" aria-label={reading ? `SOC ${reading.socPercent} persen` : "SOC belum tersedia"} className="shrink-0">
              <circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke="var(--color-surface-3)" strokeWidth={STROKE} />
              {reading && (
                <circle cx={RING / 2} cy={RING / 2} r={R} fill="none" stroke="var(--color-ok)" strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={LEN} strokeDashoffset={LEN * (1 - reading.socPercent / 100)} transform={`rotate(-90 ${RING / 2} ${RING / 2})`} />
              )}
              <text x="50%" y="48%" textAnchor="middle" className="fill-text font-mono" fontSize="18" fontWeight="600">
                {reading ? `${reading.socPercent}%` : "–"}
              </text>
              <text x="50%" y="66%" textAnchor="middle" className="fill-muted" fontSize="9">
                SOC
              </text>
            </svg>
            <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <div>
                <div className="text-xs text-muted">Operating Status</div>
                {loading || !reading ? <Skeleton className="mt-1 h-6 w-20" /> : <div className={cn("mt-0.5 text-lg font-semibold leading-7", STATUS_CLASS[reading.operatingStatus])}>{STATUS_LABEL[reading.operatingStatus]}</div>}
              </div>
              <Stat label="Voltage" value={reading && formatNumber(reading.voltageV, 1)} unit="V" loading={loading} />
              <Stat label="Current" value={reading && formatNumber(reading.currentA, 1)} unit="A" loading={loading} />
              <Stat label="Power" value={reading && formatNumber(Math.abs(reading.powerKW), 1)} unit="kW" loading={loading} />
              <Stat label="Min / Max Cell Voltage" value={reading && `${formatNumber(reading.minCellVoltageV, 3)} / ${formatNumber(reading.maxCellVoltageV, 3)}`} unit="V" loading={loading} />
              <Stat label="Min / Max Cell Temp" value={reading && `${formatNumber(reading.minCellTempC, 1)} / ${formatNumber(reading.maxCellTempC, 1)}`} unit="°C" loading={loading} />
            </div>
          </div>
        </Panel>

        <Panel title="Battery Level" cards>
          <MeasureTable
            caption="Charge dan discharge per periode"
            columns={["", "Today", "This Month", "This Year"]}
            loading={loading}
            rows={[
              ["Charge", e(reading?.dailyChargeKWh), e(reading?.monthChargeKWh), e(reading?.yearChargeKWh)],
              ["Discharge", e(reading?.dailyDischargeKWh), e(reading?.monthDischargeKWh), e(reading?.yearDischargeKWh)],
            ]}
          />
          <p className="px-2 pb-1 text-xs text-muted">Angka per unit baterai (mock membagi rata energi plant ke semua unit).</p>
        </Panel>
      </div>
    </>
  );
}
