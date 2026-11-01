import { Link } from "react-router-dom";
import { warrantyStatus, type InverterRecord } from "@/domains/device/domain/device";
import { GRID_CONNECTION_LABEL, inverterStatusLabel, inverterStatusTone, RUN_STATE_LABEL } from "@/domains/device/domain/inverter-status";
import type { InverterReading } from "@/domains/device/domain/reading";
import type { Plant } from "@/domains/plant/domain/plant";
import type { ReactNode } from "react";
import { formatDateKey, toDateKey } from "@/shared/domain/time";
import { formatNumber, scaleEnergy } from "@/shared/domain/units";
import { Chip } from "@/shared/ui/Chip";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Field, InfoGrid, MeasureTable, PlantLink, Stat, TextStat } from "./detail-shared";

interface Props {
  device: InverterRecord;
  reading?: InverterReading;
  loading: boolean;
  plant: Plant;
  photo?: ReactNode; // kartu foto di samping informasi perangkat
}

// Detail String Inverter: informasi perangkat (statis) dan parameter real-time sesuai sheet
// "Device RealTime" di EMS Parameter List.
export function InverterDetail({ device, reading, loading, plant, photo }: Props) {
  const today = toDateKey(new Date(), plant.location.timezone);
  const warranty = warrantyStatus(device.warrantyExpiresAt, today);
  const yieldToday = reading ? scaleEnergy(reading.yieldTodayKWh) : undefined;
  const totalYield = reading ? scaleEnergy(reading.totalYieldKWh) : undefined;
  const totalDcInput = reading ? scaleEnergy(reading.totalDcInputKWh) : undefined;

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
          <div className="grid gap-5">
            <div>
              <div className="text-xs text-muted">Inverter Status</div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {reading ? (
                  <>
                    <Chip variant="soft" tone={inverterStatusTone(reading.statusCode)} dot>
                      {inverterStatusLabel(reading.statusCode)}
                    </Chip>
                    <span className="font-mono text-xs text-muted">code {reading.statusCode}</span>
                  </>
                ) : (
                  <Skeleton className="h-6 w-28" />
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
              <TextStat label="Run State" value={reading && RUN_STATE_LABEL[reading.runState]} tone={reading?.runState === "DISCONNECTED" ? "text-danger-text" : undefined} />
              <TextStat label="Grid Connection" value={reading && GRID_CONNECTION_LABEL[reading.gridConnection]} />
              <div>
                <div className="text-xs text-muted">Alarm Information</div>
                <div className="mt-0.5 text-lg font-semibold leading-7">
                  {device.activeAlarms === 0 ? (
                    <span className="text-ok-text">No Alarm</span>
                  ) : (
                    <Link to="../alarm" className="text-warn-text underline-offset-2 hover:underline">
                      {device.activeAlarms} active {device.activeAlarms === 1 ? "alarm" : "alarms"}
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-separator pt-4 sm:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
              <Stat label="Active Power" value={reading && formatNumber(reading.activePowerKW, 1)} unit="kW" loading={loading} />
              <Stat label="Reactive Power" value={reading && formatNumber(reading.reactivePowerKvar, 1)} unit="kvar" loading={loading} />
              <Stat label="Apparent Power" value={reading && formatNumber(reading.apparentPowerKVA, 1)} unit="kVA" loading={loading} />
              <Stat label="Power Factor" value={reading && formatNumber(reading.powerFactor, 3)} loading={loading} />
              <Stat label="Grid Frequency" value={reading && formatNumber(reading.gridFrequencyHz, 2)} unit="Hz" loading={loading} />
              <Stat label="Rated Power" value={reading && formatNumber(reading.ratedPowerKW, 0)} unit="kW" loading={loading} />
              <Stat label="Yield Today" value={yieldToday?.value} unit={yieldToday?.unit} loading={loading} />
              <Stat label="Total Yield" value={totalYield?.value} unit={totalYield?.unit} loading={loading} />
              <Stat label="Total DC Input Energy" value={totalDcInput?.value} unit={totalDcInput?.unit} loading={loading} />
            </div>
          </div>
        </Panel>

        <Panel title="Grid (AC) Measurements" cards>
          <MeasureTable
            caption="Voltage and current per phase"
            columns={["Phase", "Voltage (V)", "Current (A)"]}
            loading={loading}
            rows={(reading?.phases ?? []).map((p) => [`Phase ${p.name}`, formatNumber(p.voltageV, 1), formatNumber(p.currentA, 1)])}
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

