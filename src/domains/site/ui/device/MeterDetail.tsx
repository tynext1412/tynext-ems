import { METER_TYPE_LABEL, type MeterRecord } from "@/domains/device/domain/device";
import { METER_STATUS_LABEL, RUN_STATE_LABEL, type MeterReading } from "@/domains/device/domain/reading";
import type { Plant } from "@/domains/plant/domain/plant";
import type { ReactNode } from "react";
import { formatDateKey } from "@/shared/domain/time";
import { formatNumber, scaleEnergy } from "@/shared/domain/units";
import { Panel } from "@/shared/ui/Panel";
import { Field, InfoGrid, MeasureTable, PlantLink, Stat, TextStat } from "./detail-shared";

interface Props {
  device: MeterRecord;
  reading?: MeterReading;
  loading: boolean;
  plant: Plant;
  photo?: ReactNode; // kartu foto di samping informasi perangkat
}

// Arti tanda Active Power per jenis meter (konfigurasi pemasangan).
const DIRECTION: Record<MeterRecord["meterType"], { positive: string; negative: string }> = {
  STG: { positive: "import from grid", negative: "export to grid" },
  ESS: { positive: "charge", negative: "discharge" },
  PV: { positive: "PV production", negative: "" },
  LOAD: { positive: "load consumption", negative: "" },
  DEG: { positive: "genset production", negative: "" },
  POWER_SENSOR: { positive: "consumption", negative: "export" },
};

// Detail meter. STG/DEG/ESS/PV/Load memakai parameter "Grid Meter"; Power Sensor memakai
// parameter "Power Sensor" (ada Meter Status, tanpa daya reaktif per fasa dan daya semu).
export function MeterDetail({ device, reading, loading, plant, photo }: Props) {
  const sensor = device.meterType === "POWER_SENSOR";
  const energy = (kWh: number | undefined, unit = "kWh") => {
    if (kWh === undefined) return { value: undefined, unit };
    if (unit !== "kWh") return { value: formatNumber(kWh, 0), unit };
    const s = scaleEnergy(kWh);
    return { value: s.value, unit: s.unit };
  };
  const fwd = energy(reading?.forwardActiveEnergyKWh);
  const rev = energy(reading?.reverseActiveEnergyKWh);
  const fwdQ = energy(reading?.forwardReactiveEnergyKvarh, "kvarh");
  const revQ = energy(reading?.reverseReactiveEnergyKvarh, "kvarh");
  const dir = DIRECTION[device.meterType];
  const direction = reading ? (reading.activePowerKW > 0.05 ? dir.positive : reading.activePowerKW < -0.05 ? dir.negative : "no flow") : undefined;

  return (
    <>
      <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
        {photo}
        <Panel title="Device Information">
          <InfoGrid>
            <Field label="Meter Type">{METER_TYPE_LABEL[device.meterType]}</Field>
            <Field label="Plant"><PlantLink plantId={plant.id} name={plant.name} /></Field>
            <Field label="Associated Datalogger" mono>{device.dataloggerId}</Field>
            <Field label="Address" mono>{String(device.address).padStart(2, "0")}</Field>
            <Field label="Model">{device.model}</Field>
            <Field label="Device Original SN" mono>{device.originalSerialNumber ?? <span className="text-muted">–</span>}</Field>
            <Field label="Commissioning Date" mono>{formatDateKey(device.commissionedAt)}</Field>
            <Field label="Firmware Version" mono>{device.firmwareVersion}</Field>
            <Field label="Vendor">{device.vendor}</Field>
          </InfoGrid>
        </Panel>
      </div>

      <div className="grid gap-3 @5xl:grid-cols-2">
        <Panel title="Real-time Information">
          <div className="grid gap-5">
            <div className="grid grid-cols-2 gap-4 @2xl:grid-cols-4 @5xl:grid-cols-2">
              <TextStat label="Run State" value={reading && RUN_STATE_LABEL[reading.runState]} tone={reading?.runState === "DISCONNECTED" ? "text-danger-text" : undefined} />
              {sensor && <TextStat label="Meter Status" value={reading?.meterStatus && METER_STATUS_LABEL[reading.meterStatus]} tone={reading?.meterStatus === "OFFLINE" ? "text-danger-text" : undefined} />}
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-separator pt-4 @2xl:grid-cols-4 @5xl:grid-cols-2">
              <Stat label="Active Power" value={reading && formatNumber(reading.activePowerKW, 1)} unit={direction ? `kW · ${direction}` : "kW"} loading={loading} />
              <Stat label="Reactive Power" value={reading && formatNumber(reading.reactivePowerKvar, 1)} unit="kvar" loading={loading} />
              {!sensor && <Stat label="Total Apparent Power" value={reading?.apparentPowerKVA === undefined ? undefined : formatNumber(reading.apparentPowerKVA, 1)} unit="kVA" loading={loading} />}
              <Stat label="Power Factor" value={reading && formatNumber(reading.powerFactor, 3)} loading={loading} />
              <Stat label="Grid Frequency" value={reading && formatNumber(reading.gridFrequencyHz, 2)} unit="Hz" loading={loading} />
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-separator pt-4 @2xl:grid-cols-4 @5xl:grid-cols-2">
              <Stat label={sensor ? "Positive Active Energy" : "Active Energy (Forward)"} value={fwd.value} unit={fwd.unit} loading={loading} />
              <Stat label="Reverse Active Energy" value={rev.value} unit={rev.unit} loading={loading} />
              <Stat label="Forward Reactive Energy" value={fwdQ.value} unit={fwdQ.unit} loading={loading} />
              <Stat label="Reverse Reactive Energy" value={revQ.value} unit={revQ.unit} loading={loading} />
            </div>
          </div>
        </Panel>
        <Panel title="Per-phase Measurements" cards>
          <MeasureTable
            caption="Voltage, current, and power per phase"
            columns={sensor ? ["Phase", "Voltage (V)", "Current (A)", "Active Power (kW)"] : ["Phase", "Voltage (V)", "Current (A)", "Active Power (kW)", "Reactive Power (kvar)"]}
            loading={loading}
            rows={(reading?.phases ?? []).map((p) => [
              `Phase ${p.name}`,
              formatNumber(p.voltageV, 1),
              formatNumber(p.currentA, 1),
              formatNumber(p.activePowerKW, 1),
              ...(sensor ? [] : [formatNumber(p.reactivePowerKvar ?? 0, 1)]),
            ])}
          />
          <MeasureTable
            caption="Line-to-line voltage"
            columns={["Line", "Voltage (V)"]}
            loading={loading}
            rows={reading ? [["AB", formatNumber(reading.lineVoltageV.ab, 1)], ["BC", formatNumber(reading.lineVoltageV.bc, 1)], ["CA", formatNumber(reading.lineVoltageV.ca, 1)]] : []}
          />
        </Panel>
      </div>
    </>
  );
}
