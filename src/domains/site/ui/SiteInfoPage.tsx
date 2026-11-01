import { CalendarDays, CircleUserRound, ExternalLink, Info, MapPin, Pencil, Zap } from "lucide-react";
import { useState, type ReactNode } from "react";
import { PLANT_TYPE_LABEL } from "@/domains/plant/domain/plant";
import { inverterAvailability } from "@/domains/plant/domain/status-policy";
import { PlantLocationMap } from "@/domains/plant/ui/PlantLocationMap";
import { formatNumber } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { CopyButton } from "@/shared/ui/CopyButton";
import { Card, Panel } from "@/shared/ui/Panel";
import { useSiteContext } from "../application/use-site";
import { SiteHeaderActions } from "./SiteLayout";
import { formatCoordinates, formatTimeZone } from "./info/format";
import { KeyDates } from "./info/KeyDates";
import { PlantInfoEditDrawer } from "./info/PlantInfoEditDrawer";
import { TariffManagementPanel } from "./info/TariffManagement";

// Halaman Information: identitas plant, kapasitas sistem, tonggak waktu, tarif; lokasi dan kontak di kanan.
// "Edit Information" di baris judul membuka drawer untuk nama, jenis, zona waktu, lokasi, dan kontak.
export function SiteInfoPage() {
  const { plant } = useSiteContext();
  const [editing, setEditing] = useState(false);
  if (!plant) return null;

  const inverter = inverterAvailability(plant.devices);
  const { lat, lng } = plant.location.point;
  const coordinates = formatCoordinates(lat, lng);
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <>
      <SiteHeaderActions>
        <Button onClick={() => setEditing(true)}>
          <Pencil className="size-4" aria-hidden />
          Edit Information
        </Button>
      </SiteHeaderActions>
      <PlantInfoEditDrawer open={editing} onClose={() => setEditing(false)} plant={plant} />

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,800fr)_minmax(304px,304fr)]">
        <div className="grid content-start gap-4">
          <Panel icon={<Info />} title="Basic Information">
            <dl className="grid gap-x-[120px] gap-y-3 md:grid-cols-2">
              <InfoRow label="Plant ID" value={<span className="font-mono">{plant.id}</span>} />
              <InfoRow label="Plant Name" value={plant.name} />
              <InfoRow
                label="Plant Type"
                value={
                  <Chip variant="soft" tone="ok" dot>
                    {PLANT_TYPE_LABEL[plant.plantType]}
                  </Chip>
                }
              />
              <InfoRow label="Time Zone" value={formatTimeZone(plant.location.timezone)} />
            </dl>
          </Panel>

          <Panel icon={<Zap />} title="System Capacity" cards bodyClassName="gap-3 md:grid-cols-[340px_1fr_1fr]">
            <CapacityCard label="PV Capacity" value={formatNumber(plant.capacity.pvKWp, 1)} unit="kWp">
              <SubTile label="Number of Module" value={formatNumber(plant.moduleCount, 0)} />
              <SubTile label="Capacity per Module" value={`${formatNumber(plant.modulePowerW, 0)} Wp`} />
            </CapacityCard>
            <CapacityCard label="Inverter Capacity" value={formatNumber(plant.capacity.inverterKW, 1)} unit="kW">
              <SubTile label="Number of Units" value={formatNumber(inverter.total, 0)} />
            </CapacityCard>
            {plant.capacity.batteryKWh > 0 ? (
              <CapacityCard label="Battery Capacity" value={formatNumber(plant.capacity.batteryKWh, 0)} unit="kWh" />
            ) : (
              <CapacityCard label="Battery Capacity" placeholder="Not installed" />
            )}
          </Panel>

          <Panel icon={<CalendarDays />} title="Key Dates" cards>
            <KeyDates plant={plant} />
          </Panel>

          <TariffManagementPanel plantId={plant.id} />
        </div>

        <div className="grid content-start gap-4">
          <Panel icon={<MapPin />} title="Location" cards>
            <Card className="isolate overflow-hidden p-0">
              <PlantLocationMap plant={plant} className="h-[164px] rounded-none" />
            </Card>
            <Card className="grid gap-3">
              <InfoRow label="Address" value={plant.location.address} />
              <InfoRow
                label="Coordinates"
                value={
                  <span className="flex items-center gap-0.5">
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="whitespace-nowrap font-mono text-brand hover:underline">
                      {coordinates}
                    </a>
                    <CopyButton value={`${lat}, ${lng}`} label="coordinates" className="size-5" />
                  </span>
                }
              />
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-brand px-3.5 text-sm font-medium text-on-brand transition-colors hover:bg-brand-hover"
              >
                Open Maps
                <ExternalLink className="size-4" aria-hidden />
              </a>
            </Card>
          </Panel>

          <Panel icon={<CircleUserRound />} title="Organization & Contact">
            <dl className="divide-y divide-separator">
              <ContactRow label="Owner">{plant.owner.name}</ContactRow>
              <ContactRow label="Owner’s Contact">
                <span className="flex items-center gap-1">
                  <a href={`mailto:${plant.owner.contactEmail}`} className="truncate text-sm font-medium text-brand hover:underline" title={plant.owner.contactEmail}>
                    {plant.owner.contactEmail}
                  </a>
                  <CopyButton value={plant.owner.contactEmail} label="email" />
                </span>
              </ContactRow>
              <ContactRow label="Assigner Organization">{plant.organization ?? <span className="text-muted">–</span>}</ContactRow>
              <ContactRow label="Installer">{plant.installer}</ContactRow>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

// Baris label kiri, nilai kanan (Basic Information, Location).
function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-h-5 items-center justify-between gap-3 text-xs">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 text-right font-medium text-text">{value}</dd>
    </div>
  );
}

// Baris bertumpuk: label di atas nilai (Organization & Contact).
function ContactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 py-3 first:pt-0 last:pb-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="text-xs font-medium text-text">{children}</dd>
    </div>
  );
}

function CapacityCard({ label, value, unit, placeholder, children }: { label: string; value?: string; unit?: string; placeholder?: string; children?: ReactNode }) {
  return (
    <Card className={cn("flex min-h-[174px] flex-col gap-6 rounded-xl")}>
      <div className="grid gap-2.5">
        <div className="text-xs text-muted">{label}</div>
        {value !== undefined ? (
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl font-semibold leading-8 text-text">{value}</span>
            {unit && <span className="text-sm text-muted">{unit}</span>}
          </div>
        ) : (
          <div className="text-base font-medium leading-8 text-muted">{placeholder}</div>
        )}
      </div>
      {children && <div className="flex gap-4">{children}</div>}
    </Card>
  );
}

function SubTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1 rounded-lg bg-bg px-2 py-1.5">
      <div className="truncate text-xs text-muted">{label}</div>
      <div className="font-mono text-sm font-medium text-text">{value}</div>
    </div>
  );
}
