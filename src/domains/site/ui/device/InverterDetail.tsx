import { Link } from "react-router-dom";
import { warrantyStatus, type InverterRecord } from "@/domains/device/domain/device";
import type { InverterReading } from "@/domains/device/domain/reading";
import type { Plant } from "@/domains/plant/domain/plant";
import type { ReactNode } from "react";
import { formatDateKey, toDateKey } from "@/shared/domain/time";
import { formatNumber, scaleEnergy } from "@/shared/domain/units";
import { Panel } from "@/shared/ui/Panel";
import { Field, InfoGrid, MeasureTable, PlantLink, Stat } from "./detail-shared";

interface Props {
  device: InverterRecord;
  reading?: InverterReading;
  loading: boolean;
  plant: Plant;
  photo?: ReactNode; // kartu foto di samping informasi perangkat
}

export function InverterDetail({ device, reading, loading, plant, photo }: Props) {
  const today = toDateKey(new Date(), plant.location.timezone);
  const warranty = warrantyStatus(device.warrantyExpiresAt, today);
  const dailyYield = reading ? scaleEnergy(reading.dailyYieldKWh) : undefined;

  return (
    <>
      <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
        {photo}
        <Panel title="Device Information">
          <InfoGrid>
            <Field label="Model">{device.model}</Field>
            <Field label="Series" mono>{device.series}</Field>
            <Field label="Rated Power" mono>{formatNumber(device.ratedPowerKW, 0)} kW</Field>
            <Field label="Plant"><PlantLink plantId={plant.id} name={plant.name} /></Field>
            <Field label="Associated Datalogger" mono>{device.dataloggerId}</Field>
            <Field label="Commissioning Date" mono>{formatDateKey(device.commissionedAt)}</Field>
            <Field label="Warranty Status">{warranty === "IN_WARRANTY" ? <span className="text-ok-text">In Warranty</span> : <span className="text-warn-text">Expired</span>}</Field>
            <Field label="Warranty Expiry Date" mono>{formatDateKey(device.warrantyExpiresAt)}</Field>
            <Field label="National Standard">{device.nationalStandard}</Field>
            <Field label="Role">{device.isMaster ? "Master" : "Slave"}</Field>
            <Field label="Address" mono>{device.address}</Field>
            <Field label="Firmware Version" mono>{device.firmwareVersion}</Field>
            <Field label="Vendor">{device.vendor}</Field>
            <Field label="Number of Strings" mono>{device.stringCount}</Field>
          </InfoGrid>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Real-time Information">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Power" value={reading && formatNumber(reading.powerKW, 1)} unit="kW" loading={loading} />
            <Stat label="Daily Yield" value={dailyYield?.value} unit={dailyYield?.unit} loading={loading} />
            <Stat label="Daily Full Load Hours" value={reading && formatNumber(reading.dailyFullLoadHours, 2)} unit="h" loading={loading} />
            <Stat label="Internal Operating Temperature" value={reading && formatNumber(reading.internalTempC, 1)} unit="°C (maks. 105 °C)" loading={loading} />
            <div>
              <div className="text-xs text-muted">Alarm Information</div>
              <div className="mt-0.5 text-lg font-semibold leading-7">
                {device.activeAlarms === 0 ? (
                  <span className="text-ok-text">No Alarm</span>
                ) : (
                  <Link to="../alarm" className="text-warn-text underline-offset-2 hover:underline">
                    {device.activeAlarms} alarm aktif
                  </Link>
                )}
              </div>
            </div>
          </div>
        </Panel>

        <Panel title="DC / AC Measurements" cards>
          <MeasureTable
            caption="String DC"
            columns={["DC", "Voltage (V)", "Current (A)", "Power (W)"]}
            loading={loading}
            rows={(reading?.strings ?? []).map((s) => [s.name, formatNumber(s.voltageV, 1), formatNumber(s.currentA, 1), formatNumber(s.powerW, 0)])}
          />
          <MeasureTable
            caption="Fasa AC"
            columns={["AC", "Voltage (V)", "Current (A)", "Frequency (Hz)"]}
            loading={loading}
            rows={(reading?.phases ?? []).map((p) => [p.name, formatNumber(p.voltageV, 1), formatNumber(p.currentA, 1), formatNumber(p.frequencyHz, 2)])}
          />
        </Panel>
      </div>
    </>
  );
}
