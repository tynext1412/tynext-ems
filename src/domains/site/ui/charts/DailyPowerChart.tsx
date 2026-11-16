import { Area, AreaChart, CartesianGrid, Customized, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { formatNumber } from "@/shared/domain/units";
import { Skeleton } from "@/shared/ui/Skeleton";
import { formatMinutes, type DailyPowerPoint } from "../../domain/chart-data";
import { isFullDay, zoomTicks, type TimeWindow } from "../../domain/period";
import type { OutageBand } from "@/domains/outage/domain/outage";
import { outageAreas } from "./outageAreas";
import { ChartFrame, ChartLegend, ChartTable, ChartTooltipBox, OutageLegendItem } from "./ChartChrome";
import { Crosshair, type CustomizedProps } from "./Crosshair";
import { useCrosshair, withCrosshair } from "./useCrosshair";
import { AXIS_TICK, CHART_CHROME, SERIES_COLOR, SERIES_LABEL } from "./chart-theme";
import { useChartZoom } from "./useChartZoom";
import { useSeriesToggle } from "./useSeriesToggle";

type PowerSeriesKey = "grid" | "pv" | "battery" | "genset" | "load";
const SERIES: readonly PowerSeriesKey[] = ["grid", "pv", "battery", "genset", "load"];
const HEIGHT = 240;

interface Props {
  points: DailyPowerPoint[] | undefined;
  loading: boolean;
  nowMinutes?: number; // penanda "Now" bila tanggal = hari ini
  timezoneAbbrev: string;
  window: TimeWindow;
  onZoom: (from: number, to: number) => void;
  onReset: () => void;
  outages?: readonly OutageBand[]; // rentang controller offline (diarsir)
}

// Daya per 5 menit sepanjang hari. Satu sumbu (kW); baterai + = charge, − = discharge.
// Area bergradien (warna seri memudar ke bawah); saat di-hover muncul garis bantu vertikal dan
// horizontal dengan label nilai di sumbu Y dan waktu di sumbu X, plus tooltip nilai semua seri.
// Seret untuk memperbesar rentang waktu; rentang dibagi dengan grafik SOC & tarif.
export function DailyPowerChart({ points, loading, nowMinutes, timezoneAbbrev, window, onZoom, onReset, outages = [] }: Props) {
  const { hidden, toggle } = useSeriesToggle();
  const { selection, handlers, frameProps } = useChartZoom(window, onZoom, onReset);
  const visible = points?.filter((p) => p.t >= window[0] && p.t <= window[1]);
  const crosshair = useCrosshair();
  const mouse = withCrosshair(handlers, crosshair);

  return (
    <ChartFrame
      title="Daily Power"
      unit="(kW)"
      legend={
        <div className="flex flex-wrap items-center">
          <ChartLegend series={SERIES} hidden={hidden} onToggle={toggle} />
          {outages.length > 0 && <OutageLegendItem />}
        </div>
      }
      zoom={{ zoomed: !isFullDay(window), onReset, rangeLabel: `${formatMinutes(window[0])}–${formatMinutes(window[1])}` }}
      table={
        visible && (
          <ChartTable
            caption="Power per 5 minutes"
            columns={[`Time (${timezoneAbbrev})`, ...SERIES.map((k) => `${SERIES_LABEL[k]} (kW)`)]}
            rows={visible.map((p) => [formatMinutes(p.t), ...SERIES.map((k) => formatNumber(p[k], 1))])}
          />
        )
      }
    >
      {loading || !points ? (
        <Skeleton className="h-60 w-full" />
      ) : points.length === 0 ? (
        <p className="grid place-items-center text-sm text-muted" style={{ height: HEIGHT }}>
          No power samples for this date yet.
        </p>
      ) : (
        <div {...frameProps}>
          <ResponsiveContainer width="100%" height={HEIGHT}>
            <AreaChart data={points} margin={{ top: 20, right: 12, left: 8, bottom: 6 }} syncId="daily" accessibilityLayer {...mouse} className="select-none">
              <defs>
                {SERIES.map((k) => (
                  <linearGradient key={k} id={`daily-fill-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SERIES_COLOR[k]} stopOpacity={0.38} />
                    <stop offset="100%" stopColor={SERIES_COLOR[k]} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
              {outageAreas(outages)}
              <XAxis type="number" dataKey="t" domain={[window[0], window[1]]} allowDataOverflow ticks={zoomTicks(window)} tickFormatter={formatMinutes} tick={AXIS_TICK} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} minTickGap={28} />
              <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} tickFormatter={(v: number) => formatNumber(v, 0)} />
              <Tooltip
                cursor={false}
                offset={16}
                content={({ active, payload, label }: TooltipProps<number, string>) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0]?.payload as DailyPowerPoint;
                  return (
                    <ChartTooltipBox
                      title={`${formatMinutes(Number(label))} (${timezoneAbbrev})`}
                      rows={SERIES.filter((k) => !hidden.has(k)).map((k) => ({
                        key: k,
                        label: k === "battery" ? `Battery (${p.battery > 0.05 ? "Charging" : p.battery < -0.05 ? "Discharging" : "Idle"})` : undefined,
                        value: `${formatNumber(Math.abs(k === "battery" ? p.battery : p[k]), 1)} kW`,
                      }))}
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
                  fill={`url(#daily-fill-${k})`}
                  fillOpacity={1}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_CHROME.surface }}
                  isAnimationActive={false}
                />
              ))}
              {nowMinutes !== undefined && (
                <ReferenceLine x={nowMinutes} stroke={CHART_CHROME.marker} strokeDasharray="4 4" label={{ value: "Now", position: "top", fill: CHART_CHROME.ink, fontSize: 11 }} />
              )}
              <Customized
                component={(props: CustomizedProps) => <Crosshair {...props} hover={crosshair.hover} formatX={formatMinutes} formatY={(v) => formatNumber(v, 0)} />}
              />
              {selection && <ReferenceArea x1={selection[0]} x2={selection[1]} fill="var(--color-brand)" fillOpacity={0.12} stroke="var(--color-brand)" strokeOpacity={0.6} />}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartFrame>
  );
}
