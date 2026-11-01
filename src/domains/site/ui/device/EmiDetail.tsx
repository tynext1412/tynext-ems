import type { EmiRecord } from "@/domains/device/domain/device";
import { RUN_STATE_LABEL, type EmiReading } from "@/domains/device/domain/reading";
import type { Plant } from "@/domains/plant/domain/plant";
import type { ReactNode } from "react";
import { formatDateKey } from "@/shared/domain/time";
import { formatNumber } from "@/shared/domain/units";
import { Panel } from "@/shared/ui/Panel";
import { Field, InfoGrid, PlantLink, Stat, TextStat } from "./detail-shared";

interface Props {
  device: EmiRecord;
  reading?: EmiReading;
  loading: boolean;
  plant: Plant;
  photo?: ReactNode; // kartu foto di samping informasi perangkat
}

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

function compass(deg: number): string {
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

// Detail EMI / weather station: iradiansi & iradiasi (POA dan horizontal), suhu udara dan modul,
// serta angin, sesuai sheet "Device RealTime" di EMS Parameter List.
export function EmiDetail({ device, reading, loading, plant, photo }: Props) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
        {photo}
        <Panel title="Device Information">
          <InfoGrid>
            <Field label="Model">{device.model}</Field>
            <Field label="Plant"><PlantLink plantId={plant.id} name={plant.name} /></Field>
            <Field label="Associated Datalogger" mono>{device.dataloggerId}</Field>
            <Field label="POA Sensor Tilt" mono>{device.poaTiltDeg}°</Field>
            <Field label="POA Sensor Azimuth" mono>{device.poaAzimuthDeg}° ({compass(device.poaAzimuthDeg)})</Field>
            <Field label="Commissioning Date" mono>{formatDateKey(device.commissionedAt)}</Field>
            <Field label="Address" mono>{device.address}</Field>
            <Field label="Firmware Version" mono>{device.firmwareVersion}</Field>
            <Field label="Vendor">{device.vendor}</Field>
          </InfoGrid>
        </Panel>
      </div>

      <div className="grid gap-3 xl:grid-cols-2">
        <Panel title="Irradiance">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Irradiance (POA)" value={reading && formatNumber(reading.irradiancePoaWm2, 0)} unit="W/m²" loading={loading} />
            <Stat label="Horizontal Irradiance" value={reading && formatNumber(reading.horizontalIrradianceWm2, 0)} unit="W/m²" loading={loading} />
            <Stat label="Daily Irradiation (POA)" value={reading && formatNumber(reading.dailyIrradiationPoaKWhM2, 2)} unit="kWh/m²" loading={loading} />
            <Stat label="Daily Horizontal Irradiation" value={reading && formatNumber(reading.dailyHorizontalIrradiationKWhM2, 2)} unit="kWh/m²" loading={loading} />
          </div>
        </Panel>
        <Panel title="Weather">
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Ambient Temperature" value={reading && formatNumber(reading.ambientTempC, 1)} unit="°C" loading={loading} />
            <Stat label="PV Module Temperature" value={reading && formatNumber(reading.moduleTempC, 1)} unit="°C" loading={loading} />
            <Stat label="Wind Speed" value={reading && formatNumber(reading.windSpeedMs, 1)} unit="m/s" loading={loading} />
            <Stat label="Wind Direction" value={reading && formatNumber(reading.windDirectionDeg, 0)} unit={reading ? `° · ${compass(reading.windDirectionDeg)}` : "°"} loading={loading} />
            <TextStat label="Run State" value={reading && RUN_STATE_LABEL[reading.runState]} tone={reading?.runState === "DISCONNECTED" ? "text-danger-text" : undefined} />
          </div>
        </Panel>
      </div>
    </>
  );
}
