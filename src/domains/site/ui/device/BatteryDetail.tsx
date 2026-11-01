import type { BatteryRecord } from "@/domains/device/domain/device";
import { ESS_WORKING_MODE_LABEL, FIRE_SUPPRESSION_LABEL, HVAC_STATUS_LABEL, RUN_STATE_LABEL, type BatteryReading } from "@/domains/device/domain/reading";
import type { Plant } from "@/domains/plant/domain/plant";
import type { ReactNode } from "react";
import { formatDateKey } from "@/shared/domain/time";
import { formatNumber, scaleEnergy } from "@/shared/domain/units";
import { Panel } from "@/shared/ui/Panel";
import { Field, InfoGrid, MeasureTable, PlantLink, Stat, TextStat } from "./detail-shared";

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

// Detail C&I ESS (perangkat Battery): parameter real-time sesuai sheet "Device RealTime"
// di EMS Parameter List, tabel energi charge/discharge per periode, dan data per rak.
export function BatteryDetail({ device, reading, loading, plant, photo }: Props) {
  const e = (kWh?: number) => {
    if (kWh === undefined) return "";
    const s = scaleEnergy(kWh);
    return `${s.value} ${s.unit}`;
  };
  const power = reading?.chargeDischargePowerKW;

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
            <Field label="Racks" mono>{device.rackCount}</Field>
            <Field label="Battery Packs" mono>{device.packCount}</Field>
            <Field label="Modules in Series" mono>{device.modulesInSeries}</Field>
            <Field label="Parallel Connections" mono>{device.parallelConnections}</Field>
            <Field label="Address" mono>{device.address}</Field>
            <Field label="Firmware Version" mono>{device.firmwareVersion}</Field>
            <Field label="Vendor">{device.vendor}</Field>
          </InfoGrid>
        </Panel>
      </div>

      <Panel title="Real-time Information">
        <div className="flex flex-wrap items-start gap-6">
          <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`} role="img" aria-label={reading ? `SOC ${reading.socPercent} percent` : "SOC not available yet"} className="shrink-0">
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
          <div className="grid min-w-0 flex-1 gap-5">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 @2xl:grid-cols-4">
              <TextStat label="Operating Status" value={reading && STATUS_LABEL[reading.operatingStatus]} tone={reading && STATUS_CLASS[reading.operatingStatus]} />
              <TextStat label="Working Mode" value={reading && ESS_WORKING_MODE_LABEL[reading.workingMode]} />
              <TextStat label="Run State" value={reading && RUN_STATE_LABEL[reading.runState]} tone={reading?.runState === "DISCONNECTED" ? "text-danger-text" : undefined} />
              <TextStat label="Thermal Mgmt (HVAC)" value={reading && HVAC_STATUS_LABEL[reading.hvacStatus]} tone={reading?.hvacStatus === "FAULT" ? "text-danger-text" : undefined} />
              <TextStat label="Fire Suppression" value={reading && FIRE_SUPPRESSION_LABEL[reading.fireSuppressionStatus]} tone={reading ? (reading.fireSuppressionStatus === "NORMAL" ? "text-ok-text" : "text-danger-text") : undefined} />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-separator pt-4 @2xl:grid-cols-4">
              <Stat label="Charge/Discharge Power" value={power === undefined ? undefined : formatNumber(power, 1)} unit="kW" loading={loading} />
              <Stat label="SOH" value={reading && formatNumber(reading.sohPercent, 1)} unit="%" loading={loading} />
              <Stat label="Rated Capacity" value={reading && formatNumber(reading.ratedCapacityKWh, 0)} unit="kWh" loading={loading} />
              <Stat label="Chargeable Energy" value={reading && formatNumber(reading.chargeableEnergyKWh, 0)} unit="kWh" loading={loading} />
              <Stat label="Dischargeable Energy" value={reading && formatNumber(reading.dischargeableEnergyKWh, 0)} unit="kWh" loading={loading} />
              <Stat label="PCS Active Power" value={reading && formatNumber(reading.pcsActivePowerKW, 1)} unit="kW" loading={loading} />
              <Stat label="PCS Reactive Power" value={reading && formatNumber(reading.pcsReactivePowerKvar, 1)} unit="kvar" loading={loading} />
              <Stat label="Max / Min Cell Voltage" value={reading && `${formatNumber(reading.maxCellVoltageV, 3)} / ${formatNumber(reading.minCellVoltageV, 3)}`} unit="V" loading={loading} />
              <Stat label="Max / Min Cell Temperature" value={reading && `${formatNumber(reading.maxCellTempC, 1)} / ${formatNumber(reading.minCellTempC, 1)}`} unit="°C" loading={loading} />
            </div>
          </div>
        </div>
      </Panel>

      <div className="grid gap-3 @5xl:grid-cols-2">
        <Panel title="Charge / Discharge Energy" cards>
          <MeasureTable
            caption="Charge Energy and Discharge Energy per period"
            columns={["", "Today", "This Month", "This Year"]}
            loading={loading}
            rows={[
              ["Charge Energy", e(reading?.chargeEnergyTodayKWh), e(reading?.chargeEnergyMonthKWh), e(reading?.chargeEnergyYearKWh)],
              ["Discharge Energy", e(reading?.dischargeEnergyTodayKWh), e(reading?.dischargeEnergyMonthKWh), e(reading?.dischargeEnergyYearKWh)],
            ]}
          />
          <p className="px-2 pb-1 text-xs text-muted">Values per battery unit (the mock splits plant energy evenly across all units).</p>
        </Panel>
        <Panel title="Rack Data" cards>
          <MeasureTable
            caption="Rack SOC, Rack Voltage, and Rack Current"
            columns={["Rack", "Rack SOC (%)", "Rack Voltage (V)", "Rack Current (A)"]}
            loading={loading}
            rows={(reading?.racks ?? []).map((r) => [r.name, formatNumber(r.socPercent, 0), formatNumber(r.voltageV, 1), formatNumber(r.currentA, 1)])}
          />
        </Panel>
      </div>
    </>
  );
}
