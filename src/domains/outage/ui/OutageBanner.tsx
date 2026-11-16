import type { Plant } from "@/domains/plant/domain/plant";
import { timezoneAbbrev, toDateKey } from "@/shared/domain/time";
import { useNow } from "@/shared/lib/useNow";
import { Alert } from "@/shared/ui/Alert";
import { useOutages } from "../application/use-outages";
import { formatDuration, ongoingOutage, outageStart, recentlyRecovered } from "../domain/outage";

// "10:41 WIB", atau dengan tanggal bila bukan hari ini.
function clock(iso: string, timeZone: string, now: number): string {
  const d = new Date(iso);
  const sameDay = toDateKey(d, timeZone) === toDateKey(new Date(now), timeZone);
  const text = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    ...(sameDay ? {} : { day: "2-digit", month: "2-digit", year: "numeric" }),
  }).format(d);
  return `${text} ${timezoneAbbrev(timeZone)}`;
}

// Status koneksi controller (PLC) plant: saat putus, dan 10 menit pertama setelah tersambung lagi.
export function OutageBanner({ plant }: { plant: Plant }) {
  const { data } = useOutages(plant.id);
  const now = useNow(15_000);
  if (!data) return null;
  const tz = plant.location.timezone;

  const ongoing = ongoingOutage(data);
  if (ongoing) {
    const since = outageStart(ongoing);
    return (
      <Alert tone="warning" className="mb-4" title={`Controller offline since ${clock(since, tz, now)} (${formatDuration(now - Date.parse(since))})`}>
        Live values are paused. The controller keeps recording and sends the missing data when it&apos;s back online. Shaded areas on the charts mark the outage.
      </Alert>
    );
  }

  const recovered = recentlyRecovered(data, now);
  if (!recovered?.onlineAt) return null;
  const lasted = formatDuration(Date.parse(recovered.onlineAt) - Date.parse(outageStart(recovered)));
  if (recovered.cause === "cx_off") {
    return (
      <Alert tone="warning" className="mb-4" title={`Controller restarted at ${clock(recovered.onlineAt, tz, now)}`}>
        It was off for {lasted}. Data from while it was off may be missing.
      </Alert>
    );
  }
  return (
    <Alert tone="success" className="mb-4" title={`Controller back online at ${clock(recovered.onlineAt, tz, now)}`}>
      The {recovered.cause === "internet" ? "internet connection was down" : "connection was lost"} for {lasted}. The controller is sending the data from that period; charts fill in within a minute.
    </Alert>
  );
}
