import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import { useDevice, useDeviceReading } from "@/domains/device/application/use-devices";
import { DEVICE_KIND_LABEL, deviceStatus } from "@/domains/device/domain/device";
import { DeviceStatusBadge } from "@/domains/device/ui/DeviceStatusBadge";
import { MasterChip } from "@/domains/device/ui/MasterChip";
import { formatDateTime, formatRelative, timezoneAbbrev } from "@/shared/domain/time";
import { useNow } from "@/shared/lib/useNow";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { CopyButton } from "@/shared/ui/CopyButton";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useSiteContext } from "../../application/use-site";
import { BatteryDetail } from "./BatteryDetail";
import { DevicePhotoCard } from "./DevicePhotoCard";
import { DeviceSwitcher } from "./DeviceSwitcher";
import { InverterDetail } from "./InverterDetail";
import { MeterDetail } from "./MeterDetail";
import { PcsDetail } from "./PcsDetail";

const DeviceChartPanel = lazy(() => import("../charts/DeviceChartPanel"));

// Detail satu perangkat: daftar perangkat sejenis di kiri (pindah perangkat tanpa kembali ke daftar),
// lalu identitas, data real-time per tipe, dan chart parameter.
export function DeviceDetailPage() {
  const { plant } = useSiteContext();
  const { deviceId = "" } = useParams();
  const device = useDevice(deviceId);
  const reading = useDeviceReading(deviceId);
  const now = useNow();
  if (!plant) return null;

  const tz = plant.location.timezone;
  const backTo = device.data ? `../device?type=${device.data.kind.toLowerCase()}` : "../device";

  return (
    <div className="grid items-start gap-3 md:grid-cols-[260px_minmax(0,1fr)]">
      <DeviceSwitcher plant={plant} kind={device.data?.kind} backTo={backTo} />

      <div className="@container grid min-w-0 gap-3">
        {device.isPending && (
          <Panel aria-label="Memuat perangkat">
            <Skeleton className="mb-3 h-6 w-64" />
            <Skeleton className="h-4 w-40" />
            <span className="sr-only">Memuat perangkat…</span>
          </Panel>
        )}
        {device.error && (
          <Panel>
            <EmptyState
              illustration="server-error"
              title="Perangkat tidak bisa dimuat"
              description={device.error.message}
              action={
                <Button variant="primary" onClick={() => void device.refetch()}>
                  Try again
                </Button>
              }
            />
          </Panel>
        )}
        {!device.isPending && !device.error && device.data === null && (
          <Panel>
            <EmptyState illustration="not-found" title="Perangkat tidak ditemukan" description={`Perangkat ${deviceId} tidak ada di plant ini.`} />
          </Panel>
        )}

        {device.data && (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3 px-1">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold leading-7">{device.data.name}</h2>
                  <DeviceStatusBadge status={deviceStatus(device.data)} />
                  {device.data.kind === "INVERTER" && device.data.isMaster && <MasterChip />}
                  <Chip variant="soft" tone="neutral">
                    {DEVICE_KIND_LABEL[device.data.kind]}
                  </Chip>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                  <span className="inline-flex items-center gap-1">
                    SN <span className="font-mono font-medium text-text">{device.data.serialNumber}</span>
                    <CopyButton value={device.data.serialNumber} label="serial number" />
                  </span>
                  <span aria-hidden>•</span>
                  <span>
                    Plant ID <span className="font-mono text-text">{plant.id}</span>
                  </span>
                  {reading.data && (
                    <>
                      <span aria-hidden>•</span>
                      <span>
                        <span className="font-mono">{formatDateTime(reading.data.at, tz)}</span> {timezoneAbbrev(tz)} · {formatRelative(reading.data.at, now)}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </header>

            {device.data.kind === "INVERTER" && <InverterDetail device={device.data} reading={reading.data?.kind === "INVERTER" ? reading.data : undefined} loading={reading.isPending} plant={plant} photo={<DevicePhotoCard device={device.data} />} />}
            {device.data.kind === "BATTERY" && <BatteryDetail device={device.data} reading={reading.data?.kind === "BATTERY" ? reading.data : undefined} loading={reading.isPending} plant={plant} photo={<DevicePhotoCard device={device.data} />} />}
            {device.data.kind === "PCS" && <PcsDetail device={device.data} reading={reading.data?.kind === "PCS" ? reading.data : undefined} loading={reading.isPending} plant={plant} photo={<DevicePhotoCard device={device.data} />} />}
            {device.data.kind === "METER" && <MeterDetail device={device.data} reading={reading.data?.kind === "METER" ? reading.data : undefined} loading={reading.isPending} plant={plant} photo={<DevicePhotoCard device={device.data} />} />}

            <Suspense
              fallback={
                <Panel title={`${DEVICE_KIND_LABEL[device.data.kind]} Chart`}>
                  <Skeleton className="h-70 w-full" />
                </Panel>
              }
            >
              <DeviceChartPanel device={device.data} plant={plant} />
            </Suspense>
          </>
        )}
      </div>
    </div>
  );
}
