import { ReferenceArea } from "recharts";
import type { OutageBand } from "@/domains/outage/domain/outage";
import { FULL_DAY, type TimeWindow } from "../../domain/period";
import { OUTAGE_BAND } from "./chart-theme";

// Lebar pita di grafik (menit): durasi asli, tetapi minimal sebagian kecil dari rentang yang
// terlihat supaya putus beberapa detik tetap tampak. Satu hari penuh: ±4 menit; di-zoom 1 jam: ±11 detik.
export function outageWidth(band: OutageBand, view: TimeWindow = FULL_DAY): number {
  return Math.max(band.to - band.from, (view[1] - view[0]) * OUTAGE_BAND.minFraction);
}

// Pita "controller offline" untuk recharts. Dipanggil sebagai fungsi (bukan komponen) karena recharts
// hanya mengenali ReferenceArea yang menjadi anak langsung chart.
export function outageAreas(bands: readonly OutageBand[], view: TimeWindow = FULL_DAY, yAxisId?: string) {
  return bands.map((b) => (
    <ReferenceArea
      key={`outage-${b.from}`}
      yAxisId={yAxisId}
      x1={b.from}
      x2={b.from + outageWidth(b, view)}
      fill={OUTAGE_BAND.fill}
      fillOpacity={OUTAGE_BAND.fillOpacity}
      stroke="none"
      ifOverflow="hidden"
    />
  ));
}
