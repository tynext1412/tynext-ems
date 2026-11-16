import { ReferenceArea } from "recharts";
import type { OutageBand } from "@/domains/outage/domain/outage";
import { OUTAGE_BAND } from "./chart-theme";

// Pita "controller offline" untuk recharts. Dipanggil sebagai fungsi (bukan komponen) karena recharts
// hanya mengenali ReferenceArea yang menjadi anak langsung chart.
export function outageAreas(bands: readonly OutageBand[], yAxisId?: string) {
  return bands.map((b) => (
    <ReferenceArea
      key={`outage-${b.from}`}
      yAxisId={yAxisId}
      x1={b.from}
      x2={Math.max(b.to, b.from + OUTAGE_BAND.minMinutes)}
      fill={OUTAGE_BAND.fill}
      fillOpacity={OUTAGE_BAND.fillOpacity}
      stroke="none"
      ifOverflow="hidden"
    />
  ));
}
