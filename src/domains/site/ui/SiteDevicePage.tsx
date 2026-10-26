import type { DeviceType } from "@/domains/plant/domain/plant";
import { inverterAvailability } from "@/domains/plant/domain/status-policy";
import { cn } from "@/shared/lib/cn";
import { Panel } from "@/shared/ui/Panel";
import { useSiteContext } from "../application/use-site";

const TYPE_LABEL: Record<DeviceType, string> = {
  INVERTER: "Inverter",
  BATTERY: "Battery",
  PCS: "PCS",
  METER: "Meter",
  LOGGER: "Data logger",
};

export function SiteDevicePage() {
  const { plant } = useSiteContext();
  if (!plant) return null;

  const inverter = inverterAvailability(plant.devices);
  const connected = plant.devices.filter((d) => d.connected).length;

  return (
    <Panel
      title="Device"
      actions={
        <p className="text-sm text-muted">
          Terhubung <span className="font-mono text-text">{connected}/{plant.devices.length}</span> · inverter online{" "}
          <span className={cn("font-mono", inverter.online === inverter.total ? "text-ok" : "text-warn")}>
            {inverter.online}/{inverter.total}
          </span>
        </p>
      }
    >
      {plant.devices.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Belum ada device terdaftar di plant ini. Daftarkan device lewat backend/provisioning.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-bg text-xs text-muted">
              <tr>
                <th className="px-3 py-2.5 font-medium">Device ID</th>
                <th className="px-3 py-2.5 font-medium">Tipe</th>
                <th className="px-3 py-2.5 font-medium">Vendor</th>
                <th className="px-3 py-2.5 font-medium">Koneksi</th>
                <th className="px-3 py-2.5 text-right font-medium">Alarm aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {plant.devices.map((d) => (
                <tr key={d.id} className="hover:bg-surface-2/70">
                  <td className="px-3 py-2.5 font-mono">{d.id}</td>
                  <td className="px-3 py-2.5">{TYPE_LABEL[d.type]}</td>
                  <td className="px-3 py-2.5">{d.vendor}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("inline-flex items-center gap-2", d.connected ? "text-ok" : "text-danger")}>
                      <span className={cn("size-2 rounded-full", d.connected ? "bg-ok" : "bg-danger")} aria-hidden />
                      {d.connected ? "Terhubung" : "Terputus"}
                    </span>
                  </td>
                  <td className={cn("px-3 py-2.5 text-right font-mono", d.activeAlarms > 0 && "text-warn")}>{d.activeAlarms}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
