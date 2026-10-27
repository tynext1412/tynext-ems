import { lazy, Suspense } from "react";
import { useParams } from "react-router-dom";
import {
  useDevice,
  useDeviceReading,
} from "@/domains/device/application/use-devices";
import {
  DEVICE_KIND_LABEL,
  deviceStatus,
} from "@/domains/device/domain/device";
import { DeviceStatusBadge } from "@/domains/device/ui/DeviceStatusBadge";
import { MasterChip } from "@/domains/device/ui/MasterChip";
import {
  formatDateTime,
  formatRelative,
  timezoneAbbrev,
} from "@/shared/domain/time";
import { useNow } from "@/shared/lib/useNow";
import { Button } from "@/shared/ui/Button";
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
  const backTo = device.data
    ? `../device?type=${device.data.kind.toLowerCase()}`
    : "../device";

  return (
    <div className="grid items-start gap-4 md:grid-cols-[16rem_minmax(0,1fr)]">
      <DeviceSwitcher plant={plant} kind={device.data?.kind} backTo={backTo} />

      <div className="@container grid min-w-0 gap-4">
        {device.isPending && (
          <Panel>
            <Skeleton className="mb-3 h-6 w-64" />
            <Skeleton className="h-4 w-40" />
            <span className="sr-only">Memuat perangkat…</span>
          </Panel>
        )}
        {device.error && (
          <Panel>
            <p role="alert" className="mb-3 text-sm">
              Perangkat tidak bisa dimuat: {device.error.message}.
            </p>
            <Button onClick={() => void device.refetch()}>
              Coba muat ulang
            </Button>
          </Panel>
        )}
        {!device.isPending && !device.error && device.data === null && (
          <Panel>
            <p className="text-sm">
              Perangkat <span className="font-mono">{deviceId}</span> tidak ada
              di plant ini.
            </p>
          </Panel>
        )}

        {device.data && (
          <>
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <DeviceStatusBadge status={deviceStatus(device.data)} />
                  <h2 className="text-xl font-semibold">{device.data.name}</h2>
                  {device.data.kind === "INVERTER" && device.data.isMaster && (
                    <MasterChip />
                  )}
                  <span className="rounded-sm border border-border px-1.5 py-0.5 text-xs text-muted">
                    {DEVICE_KIND_LABEL[device.data.kind]}
                  </span>
                </div>
                <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                  <span>
                    SN{" "}
                    <span className="font-mono text-text">
                      {device.data.serialNumber}
                    </span>
                  </span>
                  <span>
                    Plant ID <span className="font-mono">{plant.id}</span>
                  </span>
                  {reading.data && (
                    <span>
                      <span className="font-mono">
                        {formatDateTime(reading.data.at, tz)}
                      </span>{" "}
                      {timezoneAbbrev(tz)} ·{" "}
                      {formatRelative(reading.data.at, now)}
                    </span>
                  )}
                </p>
              </div>
            </header>

            {device.data.kind === "INVERTER" && (
              <InverterDetail
                device={device.data}
                reading={
                  reading.data?.kind === "INVERTER" ? reading.data : undefined
                }
                loading={reading.isPending}
                plant={plant}
                photo={<DevicePhotoCard device={device.data} />}
              />
            )}
            {device.data.kind === "BATTERY" && (
              <BatteryDetail
                device={device.data}
                reading={
                  reading.data?.kind === "BATTERY" ? reading.data : undefined
                }
                loading={reading.isPending}
                plant={plant}
                photo={<DevicePhotoCard device={device.data} />}
              />
            )}
            {device.data.kind === "PCS" && (
              <PcsDetail
                device={device.data}
                reading={
                  reading.data?.kind === "PCS" ? reading.data : undefined
                }
                loading={reading.isPending}
                plant={plant}
                photo={<DevicePhotoCard device={device.data} />}
              />
            )}
            {device.data.kind === "METER" && (
              <MeterDetail
                device={device.data}
                reading={
                  reading.data?.kind === "METER" ? reading.data : undefined
                }
                loading={reading.isPending}
                plant={plant}
                photo={<DevicePhotoCard device={device.data} />}
              />
            )}

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
