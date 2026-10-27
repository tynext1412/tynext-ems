import type { PcsRecord } from "@/domains/device/domain/device";
import { warrantyStatus } from "@/domains/device/domain/device";
import type { PcsReading } from "@/domains/device/domain/reading";
import type { Plant } from "@/domains/plant/domain/plant";
import type { ReactNode } from "react";
import { formatDateKey, toDateKey } from "@/shared/domain/time";
import { formatNumber, scaleEnergy } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Field, InfoGrid, MeasureTable, PlantLink, Stat } from "./detail-shared";

interface Props {
  device: PcsRecord;
  reading?: PcsReading;
  loading: boolean;
  plant: Plant;
  photo?: ReactNode; // kartu foto di samping informasi perangkat
}

const STATUS_LABEL = { CHARGING: "Charging (AC → DC)", DISCHARGING: "Discharging (DC → AC)", IDLE: "Standby" } as const;

// Detail PCS: spesifikasi konverter, pembacaan real-time DC/AC, dan energi charge/discharge.
export function PcsDetail({ device, reading, loading, plant, photo }: Props) {
  const today = toDateKey(new Date(), plant.location.timezone);
  const e = (kWh?: number) => {
    if (kWh === undefined) return "";
    const s = scaleEnergy(kWh);
    return `${s.value} ${s.unit}`;
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
        {photo}
        <Panel title="Informasi perangkat">
          <InfoGrid>
            <Field label="Model">{device.model}</Field>
            <Field label="Series" mono>{device.series}</Field>
            <Field label="Rated Power" mono>{formatNumber(device.ratedPowerKW, 0)} kW</Field>
            <Field label="Plant"><PlantLink plantId={plant.id} name={plant.name} /></Field>
            <Field label="Associated Datalogger" mono>{device.dataloggerId}</Field>
            <Field label="Commissioning Date" mono>{formatDateKey(device.commissionedAt)}</Field>
            <Field label="Max Charge Power" mono>{formatNumber(device.maxChargeKW, 0)} kW</Field>
            <Field label="Max Discharge Power" mono>{formatNumber(device.maxDischargeKW, 0)} kW</Field>
            <Field label="Coupling">{device.coupling}-coupled</Field>
            <Field label="AC Voltage" mono>{device.acVoltage}</Field>
            <Field label="DC Voltage Range" mono>{device.dcVoltageMinV}–{device.dcVoltageMaxV} V</Field>
            <Field label="Coupled Batteries" mono>{device.coupledBatteryIds.length > 0 ? device.coupledBatteryIds.join(", ") : "—"}</Field>
            <Field label="Warranty Status">{warrantyStatus(device.warrantyExpiresAt, today) === "IN_WARRANTY" ? "In Warranty" : "Expired"}</Field>
            <Field label="Warranty Expiry Date" mono>{formatDateKey(device.warrantyExpiresAt)}</Field>
            <Field label="Address" mono>{device.address}</Field>
            <Field label="Firmware Version" mono>{device.firmwareVersion}</Field>
            <Field label="Vendor">{device.vendor}</Field>
          </InfoGrid>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Real-time Information">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted">Operating Status</div>
              {loading || !reading ? (
                <Skeleton className="mt-1 h-5 w-24" />
              ) : (
                <div className={cn("mt-0.5 text-base font-semibold", reading.operatingStatus === "CHARGING" ? "text-secondary" : reading.operatingStatus === "DISCHARGING" ? "text-warn" : "text-muted")}>
                  {STATUS_LABEL[reading.operatingStatus]}
                </div>
              )}
            </div>
            <Stat label="AC Power" value={reading && formatNumber(Math.abs(reading.powerKW), 1)} unit="kW" loading={loading} />
            <Stat label="Efficiency" value={reading && (reading.efficiencyPercent > 0 ? formatNumber(reading.efficiencyPercent, 1) : "—")} unit={reading && reading.efficiencyPercent > 0 ? "%" : undefined} loading={loading} />
            <Stat label="DC Bus Voltage" value={reading && formatNumber(reading.dcVoltageV, 1)} unit="V" loading={loading} />
            <Stat label="DC Current" value={reading && formatNumber(reading.dcCurrentA, 1)} unit="A" loading={loading} />
            <Stat label="Internal Temperature" value={reading && formatNumber(reading.internalTempC, 1)} unit="°C" loading={loading} />
          </div>
          <div className="mt-4">
            <MeasureTable
              caption="Fasa AC"
              columns={["AC", "Voltage (V)", "Current (A)", "Frequency (Hz)"]}
              loading={loading}
              rows={(reading?.phases ?? []).map((p) => [p.name, formatNumber(p.voltageV, 1), formatNumber(p.currentA, 1), formatNumber(p.frequencyHz, 2)])}
            />
          </div>
        </Panel>

        <Panel title="Energy Throughput">
          <MeasureTable
            caption="Charge dan discharge melalui PCS"
            columns={["", "Today", "Total"]}
            loading={loading}
            rows={[
              ["Charge (AC → DC)", e(reading?.dailyChargeKWh), e(reading?.totalChargeKWh)],
              ["Discharge (DC → AC)", e(reading?.dailyDischargeKWh), e(reading?.totalDischargeKWh)],
            ]}
          />
          <p className="mt-2 text-xs text-muted">Catatan: angka per unit PCS (mock membagi rata energi baterai plant ke semua PCS).</p>
        </Panel>
      </div>
    </>
  );
}
