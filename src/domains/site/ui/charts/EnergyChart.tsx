import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import type { EnergySeriesGranularity } from "@/domains/performance/domain/performance";
import { formatNumber } from "@/shared/domain/units";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { EnergyBarPoint } from "../../domain/chart-data";
import { ChartFrame, ChartLegend, ChartTable, ChartTooltipBox } from "./ChartChrome";
import { AXIS_TICK, CHART_CHROME, compactNumber, SERIES_COLOR, SERIES_LABEL, type SeriesKey } from "./chart-theme";
import { useSeriesToggle } from "./useSeriesToggle";

// Batang bertumpuk = energi yang masuk ke sistem (grid, PV, discharge baterai, generator);
// batang negatif = charge baterai; garis = konsumsi beban.
type StackKey = "grid" | "pv" | "battery" | "genset";
const STACK: readonly StackKey[] = ["grid", "pv", "battery", "genset"];
const LEGEND: readonly SeriesKey[] = ["grid", "pv", "battery", "genset", "load"];
const STACK_KEY: Record<StackKey, "grid" | "pv" | "discharge" | "genset"> = { grid: "grid", pv: "pv", battery: "discharge", genset: "genset" };
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
}

export function EnergyChart({ points, loading, granularity }: Props) {
  const { hidden, toggle } = useSeriesToggle();

  return (
    <ChartFrame
      title={TITLE[granularity]}
      unit="(kWh)"
      legend={<ChartLegend series={LEGEND} hidden={hidden} onToggle={toggle} />}
      table={
        points && (
          <ChartTable
            caption={TITLE[granularity]}
            columns={["Periode", "Grid (kWh)", "PV (kWh)", "Discharge (kWh)", "Charge (kWh)", "Generator (kWh)", "Load (kWh)"]}
            rows={points.map((p) => [p.key, formatNumber(p.grid, 0), formatNumber(p.pv, 0), formatNumber(p.discharge, 0), formatNumber(-p.charge, 0), formatNumber(p.genset, 0), formatNumber(p.load, 0)])}
          />
        )
      }
    >
      {loading || !points ? (
        <Skeleton className="h-70 w-full" />
      ) : points.length === 0 ? (
        <p className="grid place-items-center text-sm text-muted" style={{ height: HEIGHT }}>
          Belum ada data energi untuk periode ini.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={HEIGHT}>
          {/* stackOffset="sign": nilai positif menumpuk ke atas, charge (negatif) ke bawah dalam satu batang. */}
          <ComposedChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="30%" stackOffset="sign" accessibilityLayer>
            <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
            <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} interval="preserveStartEnd" minTickGap={12} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} tickFormatter={compactNumber} />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.04)" }}
              content={({ active, payload, label }: TooltipProps<number, string>) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload as EnergyBarPoint;
                const rows = [
                  ...STACK.filter((k) => !hidden.has(k)).map((k) => ({ key: k, value: `${formatNumber(p[STACK_KEY[k]], 0)} kWh` })),
                  ...(!hidden.has("battery") ? [{ key: "battery" as SeriesKey, value: `charge ${formatNumber(-p.charge, 0)} kWh` }] : []),
                  ...(!hidden.has("load") ? [{ key: "load" as SeriesKey, value: `${formatNumber(p.load, 0)} kWh` }] : []),
                ];
                return <ChartTooltipBox title={`Periode ${label}`} rows={rows} />;
              }}
            />
            {STACK.map((k) => (
              <Bar key={k} dataKey={STACK_KEY[k]} name={SERIES_LABEL[k]} stackId="supply" hide={hidden.has(k)} fill={SERIES_COLOR[k]} stroke={CHART_CHROME.surface} strokeWidth={1} maxBarSize={24} isAnimationActive={false} />
            ))}
            <Bar dataKey="charge" name="Charge" stackId="supply" hide={hidden.has("battery")} fill={SERIES_COLOR.battery} fillOpacity={0.55} stroke={CHART_CHROME.surface} strokeWidth={1} maxBarSize={24} isAnimationActive={false} />
            <Line type="monotone" dataKey="load" name={SERIES_LABEL.load} hide={hidden.has("load")} stroke={SERIES_COLOR.load} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_CHROME.surface }} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
