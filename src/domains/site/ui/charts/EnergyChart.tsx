import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import type { EnergySeriesGranularity } from "@/domains/performance/domain/performance";
import { formatNumber } from "@/shared/domain/units";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { EnergyBarPoint } from "../../domain/chart-data";
import { ChartFrame, ChartLegend, ChartTable, ChartTooltipBox } from "./ChartChrome";
import { AXIS_TICK, CHART_CHROME, compactNumber, SERIES_COLOR, SERIES_LABEL } from "./chart-theme";
import { useSeriesToggle } from "./useSeriesToggle";

// Batang berkelompok (tidak ditumpuk): tiap periode punya satu batang per aliran energi, jadi
// besarnya bisa dibandingkan langsung terhadap sumbu nol.
type EnergyKey = "pv" | "import" | "export" | "charge" | "discharge" | "consumption";
const ALL: readonly EnergyKey[] = ["pv", "import", "export", "charge", "discharge", "consumption"];
const NO_BATTERY: readonly EnergyKey[] = ["pv", "import", "export", "consumption"];
const HEIGHT = 280;

const TITLE: Record<EnergySeriesGranularity, string> = {
  month: "Energy per day",
  year: "Energy per month",
  lifetime: "Energy per year",
};

interface Props {
  points: EnergyBarPoint[] | undefined;
  loading: boolean;
  granularity: EnergySeriesGranularity;
  hasBattery: boolean; // tanpa BESS, batang Charge/Discharge tidak ditampilkan
}

export function EnergyChart({ points, loading, granularity, hasBattery }: Props) {
  const { hidden, toggle } = useSeriesToggle();
  const series = hasBattery ? ALL : NO_BATTERY;

  return (
    <ChartFrame
      title={TITLE[granularity]}
      unit="(kWh)"
      legend={<ChartLegend series={series} hidden={hidden} onToggle={toggle} />}
      table={
        points && (
          <ChartTable
            caption={TITLE[granularity]}
            columns={["Period", ...series.map((k) => `${SERIES_LABEL[k]} (kWh)`)]}
            rows={points.map((p) => [p.key, ...series.map((k) => formatNumber(p[k], 0))])}
          />
        )
      }
    >
      {loading || !points ? (
        <Skeleton className="h-70 w-full" />
      ) : points.length === 0 ? (
        <p className="grid place-items-center text-sm text-muted" style={{ height: HEIGHT }}>
          No energy data for this period yet.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={HEIGHT}>
          <BarChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="18%" barGap={2} accessibilityLayer>
            <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} interval="preserveStartEnd" minTickGap={12} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} tickFormatter={compactNumber} />
            <Tooltip
              cursor={{ fill: "var(--color-surface-3)", fillOpacity: 0.6 }}
              content={({ active, payload, label }: TooltipProps<number, string>) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload as EnergyBarPoint;
                return <ChartTooltipBox title={`Period ${label}`} rows={series.filter((k) => !hidden.has(k)).map((k) => ({ key: k, value: `${formatNumber(p[k], 0)} kWh` }))} />;
              }}
            />
            {series.map((k) => (
              <Bar key={k} dataKey={k} name={SERIES_LABEL[k]} hide={hidden.has(k)} fill={SERIES_COLOR[k]} radius={[3, 3, 0, 0]} maxBarSize={14} isAnimationActive={false} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
