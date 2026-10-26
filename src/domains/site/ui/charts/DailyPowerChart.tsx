import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { formatNumber } from "@/shared/domain/units";
import { Skeleton } from "@/shared/ui/Skeleton";
import { formatMinutes, type DailyPowerPoint } from "../../domain/chart-data";
import { zoomTicks, type TimeWindow } from "../../domain/period";
import { ChartFrame, ChartLegend, ChartTable, ChartTooltipBox } from "./ChartChrome";
import { AXIS_TICK, CHART_CHROME, SERIES_COLOR, SERIES_LABEL } from "./chart-theme";
import { useDragZoom } from "./useDragZoom";
import { useSeriesToggle } from "./useSeriesToggle";

type PowerSeriesKey = "grid" | "pv" | "battery" | "genset" | "load";
const SERIES: readonly PowerSeriesKey[] = ["grid", "pv", "battery", "genset", "load"];

interface Props {
  points: DailyPowerPoint[] | undefined;
  loading: boolean;
  nowMinutes?: number; // penanda "Now" bila tanggal = hari ini
  timezoneAbbrev: string;
  window: TimeWindow;
  onZoom: (from: number, to: number) => void;
}

// Daya per 5 menit sepanjang hari. Satu sumbu (kW); baterai + = charge, − = discharge.
// Seret untuk memperbesar rentang waktu; rentang dibagi dengan grafik SOC dan tarif.
export function DailyPowerChart({ points, loading, nowMinutes, timezoneAbbrev, window, onZoom }: Props) {
  const { hidden, toggle } = useSeriesToggle();
  const { selection, handlers } = useDragZoom(onZoom);
  const visible = points?.filter((p) => p.t >= window[0] && p.t <= window[1]);

  return (
    <ChartFrame
      title="Daya harian (kW)"
      legend={<ChartLegend series={SERIES} hidden={hidden} onToggle={toggle} />}
      table={
        visible && (
          <ChartTable
            caption="Daya per 5 menit"
            columns={[`Waktu (${timezoneAbbrev})`, ...SERIES.map((k) => `${SERIES_LABEL[k]} (kW)`)]}
            rows={visible.map((p) => [formatMinutes(p.t), ...SERIES.map((k) => formatNumber(p[k], 1))])}
          />
        )
      }
    >
      {loading || !points ? (
        <Skeleton className="h-70 w-full" />
      ) : points.length === 0 ? (
        <p className="grid h-70 place-items-center text-sm text-muted">Belum ada sampel daya untuk tanggal ini.</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={points} margin={{ top: 20, right: 12, left: 0, bottom: 0 }} syncId="daily" accessibilityLayer {...handlers} className="select-none">
            <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
            <XAxis type="number" dataKey="t" domain={[window[0], window[1]]} allowDataOverflow ticks={zoomTicks(window)} tickFormatter={formatMinutes} tick={AXIS_TICK} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} minTickGap={28} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} tickFormatter={(v: number) => formatNumber(v, 0)} />
            <Tooltip
              cursor={{ stroke: CHART_CHROME.marker, strokeWidth: 1 }}
              content={({ active, payload, label }: TooltipProps<number, string>) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload as DailyPowerPoint;
                return (
                  <ChartTooltipBox
                    title={`${formatMinutes(Number(label))} ${timezoneAbbrev}`}
                    rows={SERIES.filter((k) => !hidden.has(k)).map((k) => ({ key: k, value: `${formatNumber(p[k], 1)} kW` }))}
                  />
                );
              }}
            />
            {SERIES.map((k) => (
              <Area
                key={k}
                type="monotone"
                dataKey={k}
                name={SERIES_LABEL[k]}
                hide={hidden.has(k)}
                stroke={SERIES_COLOR[k]}
                strokeWidth={2}
                fill={SERIES_COLOR[k]}
                fillOpacity={0.1}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_CHROME.surface }}
                isAnimationActive={false}
              />
            ))}
            {nowMinutes !== undefined && (
              <ReferenceLine x={nowMinutes} stroke={CHART_CHROME.marker} strokeDasharray="4 4" label={{ value: "Now", position: "top", fill: CHART_CHROME.ink, fontSize: 11 }} />
            )}
            {selection && <ReferenceArea x1={selection[0]} x2={selection[1]} fill="var(--color-copper)" fillOpacity={0.12} stroke="var(--color-copper)" strokeOpacity={0.6} />}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
