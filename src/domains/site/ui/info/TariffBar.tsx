import { formatHour, tariffSegments, type PurchaseTariff, type TariffSegment } from "@/domains/performance/domain/tariff";
import { formatNumber } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";

// Warna ruas: tarif dasar = biru pudar, periode lebih mahal dari dasar = biru penuh,
// periode lebih murah = biru sedang. Label jam & tarif selalu ditulis, warna bukan satu-satunya penanda.
function tone(segment: TariffSegment, base: number): string {
  if (segment.band === null) return "bg-accent/15";
  return segment.rateIDRPerKWh >= base ? "bg-accent" : "bg-accent/45";
}

const MIN_TICK_GAP_HOURS = 3; // label "HH:00" butuh ±3 jam di lebar kartu tersempit

// Bar 24 jam dengan label jam di setiap pergantian tarif.
export function TariffBar({ tariff, className }: { tariff: PurchaseTariff; className?: string }) {
  const segments = tariffSegments(tariff);
  const base = tariff.baseRateIDRPerKWh;
  const ticks: number[] = [];
  for (const h of [...segments.map((s) => s.startHour), 24]) {
    const last = ticks.at(-1);
    if (last === undefined || h - last >= MIN_TICK_GAP_HOURS) ticks.push(h);
  }
  const description = segments.map((s) => `${formatHour(s.startHour)}–${formatHour(s.endHour)} Rp ${formatNumber(s.rateIDRPerKWh, 2)}`).join(", ");

  return (
    <div role="img" aria-label={`Hourly tariff: ${description}`} className={className}>
      <div className="flex h-2 w-full gap-px overflow-hidden rounded-full">
        {segments.map((s) => (
          <span key={s.startHour} className={cn("h-full", tone(s, base))} style={{ width: `${((s.endHour - s.startHour) / 24) * 100}%` }} />
        ))}
      </div>
      <div className="relative mt-1 h-5 text-xs text-muted">
        {ticks.map((h) => (
          <span key={h} className="absolute top-0 whitespace-nowrap font-mono" style={{ left: `${(h / 24) * 100}%`, transform: h === 0 ? undefined : h === 24 ? "translateX(-100%)" : "translateX(-50%)" }}>
            {formatHour(h)}
          </span>
        ))}
      </div>
    </div>
  );
}

// Swatch yang sama dengan ruas bar, untuk daftar periode.
export function TariffSwatch({ segment, base }: { segment: TariffSegment; base: number }) {
  return <span className={cn("size-2 shrink-0 rounded-full", segment.band === null ? "bg-accent/25" : tone(segment, base))} aria-hidden />;
}
