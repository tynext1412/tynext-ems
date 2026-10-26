import { usePerformances } from "@/domains/performance/application/use-performances";
import { inverterAvailability } from "@/domains/plant/domain/status-policy";
import { formatDateKey, timezoneAbbrev } from "@/shared/domain/time";
import { formatKW, formatKWh, formatKWp, formatNumber } from "@/shared/domain/units";
import { Panel } from "@/shared/ui/Panel";
import { useSiteContext } from "../application/use-site";

export function SiteInfoPage() {
  const { plant } = useSiteContext();
  const performances = usePerformances();
  if (!plant) return null;

  const performance = performances.data?.find((p) => p.plantId === plant.id);
  const inverter = inverterAvailability(plant.devices);
  const { lat, lng } = plant.location.point;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel title="Identitas plant">
        <Fields
          items={[
            ["Plant Name", plant.name],
            ["ID", plant.id, true],
            ["Owner", plant.owner.name],
            ["Owner's Contact", plant.owner.contactEmail, true],
            ["Installer", plant.installer],
            ["Commissioned", formatDateKey(plant.commissionedAt), true],
          ]}
        />
      </Panel>

      <Panel title="Lokasi">
        <Fields
          items={[
            ["Address", plant.location.address],
            ["Latitude", lat.toFixed(6), true],
            ["Longitude", lng.toFixed(6), true],
            ["Zona waktu", `${plant.location.timezone} (${timezoneAbbrev(plant.location.timezone)})`, true],
          ]}
        />
      </Panel>

      <Panel title="Kapasitas">
        <Fields
          items={[
            ["PV Capacity", formatKWp(plant.capacity.pvKWp, 1), true],
            ["Inverter Capacity", formatKW(plant.capacity.inverterKW, 1), true],
            ["Battery Capacity", plant.capacity.batteryKWh > 0 ? formatKWh(plant.capacity.batteryKWh, 0) : "tidak terpasang", plant.capacity.batteryKWh > 0],
            ["Inverter terpasang", `${inverter.total} unit`, true],
          ]}
        />
      </Panel>

      <Panel title="Tarif">
        <Fields
          items={[
            ["Tariff", performance ? `Rp ${formatNumber(performance.tariffIDRPerKWh, 2)} / kWh` : performances.isPending ? "memuat…" : "belum ada data", Boolean(performance)],
          ]}
        />
      </Panel>
    </div>
  );
}

function Fields({ items }: { items: [string, string, boolean?][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {items.map(([label, value, mono]) => (
        <div key={label}>
          <dt className="text-xs text-muted">{label}</dt>
          <dd className={mono ? "mt-0.5 font-mono" : "mt-0.5"}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
