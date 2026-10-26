import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { formatNumber } from "@/shared/domain/units";
import { Skeleton } from "@/shared/ui/Skeleton";
import { formatMinutes, type TariffChartPoint } from "../../domain/chart-data";
import { zoomTicks, type TimeWindow } from "../../domain/period";
import { ChartFrame, ChartLegend, ChartTable, ChartTooltipBox } from "./ChartChrome";
import { AXIS_TICK, CHART_CHROME, compactNumber, SERIES_COLOR, SERIES_LABEL } from "./chart-theme";
import { useDragZoom } from "./useDragZoom";
import { useSeriesToggle } from "./useSeriesToggle";

type TariffSeriesKey = "purchase" | "feedIn";
const SERIES: readonly TariffSeriesKey[] = ["purchase", "feedIn"];

interface Props {
  points: TariffChartPoint[] | undefined;
  loading: boolean;
  nowMinutes?: number;
  timezoneAbbrev: string;
  window: TimeWindow;
  onZoom: (from: number, to: number) => void;
}

// Tarif beli (grid) dan jual (feed-in) per jam, Rp/kWh. Dipisah dari SOC agar tidak ada sumbu ganda.
export function TariffChart({ points, loading, nowMinutes, timezoneAbbrev, window, onZoom }: Props) {
  const { hidden, toggle } = useSeriesToggle();
  const { selection, handlers } = useDragZoom(onZoom);

  return (
    <ChartFrame
      title="Tarif (Rp/kWh)"
      legend={<ChartLegend series={SERIES} hidden={hidden} onToggle={toggle} />}
      table={points && <ChartTable caption="Tarif per jam" columns={[`Jam (${timezoneAbbrev})`, "Purchase (Rp/kWh)", "Feed-in (Rp/kWh)"]} rows={points.map((p) => [formatMinutes(p.t), formatNumber(p.purchase, 2), formatNumber(p.feedIn, 2)])} />}
    >
      {loading || !points ? (
        <Skeleton className="h-50 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} syncId="daily" accessibilityLayer {...handlers} className="select-none">
            <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
            <XAxis type="number" dataKey="t" domain={[window[0], window[1]]} allowDataOverflow ticks={zoomTicks(window)} tickFormatter={formatMinutes} tick={AXIS_TICK} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} minTickGap={28} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} tickFormatter={compactNumber} domain={[0, "auto"]} />
            <Tooltip
              cursor={{ stroke: CHART_CHROME.marker, strokeWidth: 1 }}
              content={({ active, payload, label }: TooltipProps<number, string>) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload as TariffChartPoint;
                return (
                  <ChartTooltipBox
                    title={`${formatMinutes(Number(label))} ${timezoneAbbrev}`}
                    rows={SERIES.filter((k) => !hidden.has(k)).map((k) => ({ key: k, value: `Rp ${formatNumber(p[k], 2)}` }))}
                  />
                );
              }}
            />
            {SERIES.map((k) => (
              <Line key={k} type="stepAfter" dataKey={k} name={SERIES_LABEL[k]} hide={hidden.has(k)} stroke={SERIES_COLOR[k]} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_CHROME.surface }} isAnimationActive={false} />
            ))}
            {nowMinutes !== undefined && <ReferenceLine x={nowMinutes} stroke={CHART_CHROME.marker} strokeDasharray="4 4" />}
            {selection && <ReferenceArea x1={selection[0]} x2={selection[1]} fill="var(--color-copper)" fillOpacity={0.12} stroke="var(--color-copper)" strokeOpacity={0.6} />}
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
