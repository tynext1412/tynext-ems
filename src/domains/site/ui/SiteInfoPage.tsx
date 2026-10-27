import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { usePerformances } from "@/domains/performance/application/use-performances";
import { PLANT_TYPE_LABEL } from "@/domains/plant/domain/plant";
import { inverterAvailability } from "@/domains/plant/domain/status-policy";
import { PlantLocationMap } from "@/domains/plant/ui/PlantLocationMap";
import { formatDateKey, formatDateTime, timezoneAbbrev, zoneOffsetMinutes } from "@/shared/domain/time";
import { formatKW, formatKWh, formatKWp, formatNumber } from "@/shared/domain/units";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useSiteContext } from "../application/use-site";

function utcOffsetLabel(timeZone: string): string {
  const minutes = zoneOffsetMinutes(timeZone, new Date());
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

// Halaman Info: Basic Information + Tariff Management, mengikuti contoh desain.
export function SiteInfoPage() {
  const { plant } = useSiteContext();
  const performances = usePerformances();
  if (!plant) return null;

  const performance = performances.data?.find((p) => p.plantId === plant.id);
  const inverter = inverterAvailability(plant.devices);
  const tz = plant.location.timezone;
  const { lat, lng } = plant.location.point;
  const gps = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Panel title="Basic Information">
        <dl className="divide-y divide-border/60">
          <Row label="Plant Name">{plant.name}</Row>
          <Row label="Plant Type">{PLANT_TYPE_LABEL[plant.plantType]}</Row>
          <Row label="PV Capacity" mono>{formatKWp(plant.capacity.pvKWp, 1)}</Row>
          <Row label="Number of Modules" mono>{formatNumber(plant.moduleCount, 0)}</Row>
          <Row label="Capacity per Module" mono>{formatNumber(plant.modulePowerW, 0)} Wp</Row>
          <Row label="Inverter Capacity" mono>{formatKW(plant.capacity.inverterKW, 1)} · {inverter.total} unit</Row>
          <Row label="Battery Capacity" mono>{plant.capacity.batteryKWh > 0 ? formatKWh(plant.capacity.batteryKWh, 0) : <span className="text-muted">tidak terpasang</span>}</Row>
          <Row label="Time Zone" mono>({utcOffsetLabel(tz)}) {tz} · {timezoneAbbrev(tz)}</Row>
          <Row label="Platform Connection Date" mono>{formatDateKey(plant.platformConnectedAt)}</Row>
          <Row label="Grid Connection Date" mono>{formatDateKey(plant.gridConnectedAt)}</Row>
          <Row label="Commissioning Date" mono>{formatDateKey(plant.commissionedAt)}</Row>
          <Row label="Plant creation time" mono>{formatDateTime(plant.createdAt, tz)} ({utcOffsetLabel(tz)})</Row>
          <Row label="Plant Address">
            <div>{plant.location.address}</div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs">
              <span className="text-muted">
                GPS <span className="font-mono text-text">{gps}</span>
              </span>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline">
                Buka di Google Maps
                <ExternalLink className="size-3" aria-hidden />
              </a>
            </div>
          </Row>
          <Row label="Assigned Organization">{plant.organization ?? <span className="text-muted">belum ditetapkan</span>}</Row>
          <Row label="Owner">{plant.owner.name}</Row>
          <Row label="Owner's Contact">
            <a href={`mailto:${plant.owner.contactEmail}`} className="text-accent underline-offset-2 hover:underline">
              {plant.owner.contactEmail}
            </a>
          </Row>
          <Row label="Installer">{plant.installer}</Row>
        </dl>

        <h3 className="mb-3 mt-6 text-sm font-semibold">Tariff Management</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <TariffCard title="Purchase Tariff" note="LWBP; WBP pukul 17:00–22:00 ×1,4 (lihat grafik tarif di Overview)" value={performance?.purchaseTariffIDRPerKWh} loading={performances.isPending} error={performances.error?.message} />
          <TariffCard title="Feed-in Tariff" note="Dasar perhitungan revenue" value={performance?.tariffIDRPerKWh} loading={performances.isPending} error={performances.error?.message} />
        </div>
      </Panel>

      <div className="grid content-start gap-4">
        <Panel title="Lokasi plant">
          {/* Foto plant belum ada; citra satelit dari koordinat GPS dipakai sebagai gambaran lokasi. */}
          <PlantLocationMap plant={plant} />
          <p className="mt-2 text-xs text-muted">
            Citra satelit di koordinat <span className="font-mono text-text">{gps}</span>. Foto plant belum tersedia.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-0.5 py-2.5 text-sm sm:grid-cols-[220px_minmax(0,1fr)]">
      <dt className="text-muted">{label}</dt>
      <dd className={mono ? "font-mono" : undefined}>{children}</dd>
    </div>
  );
}

function TariffCard({ title, note, value, loading, error }: { title: string; note: string; value?: number; loading: boolean; error?: string }) {
  return (
    <div className="rounded-md border border-border bg-bg px-4 py-3">
      <div className="text-sm font-medium">{title}</div>
      {loading ? (
        <Skeleton className="mt-2 h-6 w-32" />
      ) : error ? (
        <p role="alert" className="mt-2 text-xs text-danger">
          Tarif tidak bisa dimuat: {error}
        </p>
      ) : value === undefined ? (
        <p className="mt-2 text-sm text-muted">belum ditetapkan</p>
      ) : (
        <div className="mt-2 font-mono text-xl font-semibold">
          Rp {formatNumber(value, 2)}
          <span className="ml-1 text-xs font-medium text-muted">/kWh</span>
        </div>
      )}
      <p className="mt-1 text-xs text-muted">{note}</p>
    </div>
  );
}
