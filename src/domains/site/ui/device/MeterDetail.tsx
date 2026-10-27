import type { MeterRecord } from "@/domains/device/domain/device";
import type { MeterReading } from "@/domains/device/domain/reading";
import type { Plant } from "@/domains/plant/domain/plant";
import type { ReactNode } from "react";
import { formatDateKey } from "@/shared/domain/time";
import { formatNumber, scaleEnergy } from "@/shared/domain/units";
import { Panel } from "@/shared/ui/Panel";
import { Field, InfoGrid, MeasureTable, PlantLink, Stat } from "./detail-shared";

interface Props {
  device: MeterRecord;
  reading?: MeterReading;
  loading: boolean;
  plant: Plant;
  photo?: ReactNode; // kartu foto di samping informasi perangkat
}

export function MeterDetail({ device, reading, loading, plant, photo }: Props) {
  const imp = reading ? scaleEnergy(reading.dailyImportKWh) : undefined;
  const exp = reading ? scaleEnergy(reading.dailyExportKWh) : undefined;
  const direction = reading ? (reading.activePowerKW > 0.05 ? "impor dari grid" : reading.activePowerKW < -0.05 ? "ekspor ke grid" : "tidak ada aliran") : undefined;

  return (
    <>
      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        {photo}
        <Panel title="Informasi perangkat">
          <InfoGrid>
            <Field label="Plant"><PlantLink plantId={plant.id} name={plant.name} /></Field>
            <Field label="Associated Datalogger" mono>{device.dataloggerId}</Field>
            <Field label="Address" mono>{String(device.address).padStart(2, "0")}</Field>
            <Field label="Model">{device.model}</Field>
            <Field label="Device Original SN" mono>{device.originalSerialNumber ?? <span className="text-muted">n/a</span>}</Field>
            <Field label="Commissioning Date" mono>{formatDateKey(device.commissionedAt)}</Field>
            <Field label="Firmware Version" mono>{device.firmwareVersion}</Field>
            <Field label="Vendor">{device.vendor}</Field>
          </InfoGrid>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Real-time data">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Active Power" value={reading && formatNumber(Math.abs(reading.activePowerKW), 1)} unit={direction ? `kW · ${direction}` : "kW"} loading={loading} />
            <Stat label="Daily Import" value={imp?.value} unit={imp?.unit} loading={loading} />
            <Stat label="Daily Export" value={exp?.value} unit={exp?.unit} loading={loading} />
            <Stat label="Power Factor" value={reading && formatNumber(reading.powerFactor, 2)} loading={loading} />
          </div>
        </Panel>
        <Panel title="Pengukuran per fasa">
          <MeasureTable
            caption="Fasa"
            columns={["Fasa", "Voltage (V)", "Current (A)", "Frequency (Hz)"]}
            loading={loading}
            rows={(reading?.phases ?? []).map((p) => [p.name, formatNumber(p.voltageV, 1), formatNumber(p.currentA, 1), formatNumber(p.frequencyHz, 2)])}
          />
        </Panel>
      </div>
    </>
  );
}
