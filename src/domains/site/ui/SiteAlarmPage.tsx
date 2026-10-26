import { useState } from "react";
import { isActive, SEVERITY_LABEL, sortAlarms, type AlarmSeverity } from "@/domains/alarm/domain/alarm";
import { formatDateTime } from "@/shared/domain/time";
import { cn } from "@/shared/lib/cn";
import { Panel } from "@/shared/ui/Panel";
import { Tabs } from "@/shared/ui/Tabs";
import { useSiteContext } from "../application/use-site";

type Filter = "active" | "history";

const SEVERITY_CLASS: Record<AlarmSeverity, string> = {
  CRITICAL: "text-danger",
  WARNING: "text-warn",
  INFO: "text-muted",
};

export function SiteAlarmPage() {
  const { plant, alarms, activeAlarmCount } = useSiteContext();
  const [filter, setFilter] = useState<Filter>("active");
  if (!plant) return null;

  const rows = sortAlarms(alarms).filter((a) => (filter === "active" ? isActive(a) : !isActive(a)));
  const tz = plant.location.timezone;

  return (
    <Panel title="Alarm">
      <Tabs
        className="mb-4"
        value={filter}
        onChange={setFilter}
        items={[
          { value: "active", label: "Aktif", count: activeAlarmCount },
          { value: "history", label: "Riwayat", count: alarms.length - activeAlarmCount },
        ]}
      />

      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">
          {filter === "active" ? "Tidak ada alarm aktif. Semua device melapor normal." : "Belum ada alarm yang sudah selesai dalam riwayat."}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-bg text-xs text-muted">
              <tr>
                <th className="px-3 py-2.5 font-medium">Severity</th>
                <th className="px-3 py-2.5 font-medium">Kode</th>
                <th className="px-3 py-2.5 font-medium">Pesan</th>
                <th className="px-3 py-2.5 font-medium">Device</th>
                <th className="px-3 py-2.5 font-medium">Muncul</th>
                <th className="px-3 py-2.5 font-medium">Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-surface-2/70">
                  <td className={cn("px-3 py-2.5 font-medium", SEVERITY_CLASS[a.severity])}>{SEVERITY_LABEL[a.severity]}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{a.code}</td>
                  <td className="px-3 py-2.5">{a.message}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{a.deviceId}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{formatDateTime(a.raisedAt, tz)}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{a.clearedAt ? formatDateTime(a.clearedAt, tz) : <span className="text-warn">masih aktif</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
