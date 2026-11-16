import { Area, CartesianGrid, ComposedChart, Customized, Line, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { formatNumber } from "@/shared/domain/units";
import { Skeleton } from "@/shared/ui/Skeleton";
import { formatMinutes, type SocTariffPoint } from "../../domain/chart-data";
import { isFullDay, zoomTicks, type TimeWindow } from "../../domain/period";
import type { OutageBand } from "@/domains/outage/domain/outage";
import { outageAreas } from "./outageAreas";
import { ChartFrame, ChartLegend, ChartTable, ChartTooltipBox, OutageLegendItem, type TooltipRow } from "./ChartChrome";
import { Crosshair, type CustomizedProps } from "./Crosshair";
import { AXIS_TICK, CHART_CHROME, compactNumber, SERIES_COLOR, SERIES_LABEL, type SeriesKey } from "./chart-theme";
import { useChartZoom } from "./useChartZoom";
import { useCrosshair, withCrosshair } from "./useCrosshair";
import { useSeriesToggle } from "./useSeriesToggle";

type TariffKey = "purchase" | "feedIn";
const TARIFF: readonly TariffKey[] = ["purchase", "feedIn"];
const HEIGHT = 240;

interface Props {
  points: SocTariffPoint[] | undefined;
  loading: boolean;
  nowMinutes?: number;
  timezoneAbbrev: string;
  hasBattery: boolean;
  window: TimeWindow;
  onZoom: (from: number, to: number) => void;
  onReset: () => void;
  outages?: readonly OutageBand[]; // rentang controller offline (diarsir)
}

// SOC baterai (area, sumbu kiri 0–100 %) dan tarif beli/jual (garis tangga, sumbu kanan Rp/kWh)
// dalam satu grafik. Dua sumbu, jadi crosshair menampilkan nilai keduanya: % di kiri, Rp di kanan.
// Plant tanpa BESS hanya menampilkan tarif, dengan sumbunya di kiri.
export function SocTariffChart({ points, loading, nowMinutes, timezoneAbbrev, hasBattery, window, onZoom, onReset, outages = [] }: Props) {
  const { hidden, toggle } = useSeriesToggle();
  const { selection, handlers, frameProps } = useChartZoom(window, onZoom, onReset);
  const crosshair = useCrosshair();
  const mouse = withCrosshair(handlers, crosshair);

  const series: readonly SeriesKey[] = hasBattery ? ["soc", ...TARIFF] : TARIFF;
  const visible = points?.filter((p) => p.t >= window[0] && p.t <= window[1]);
  const plain = (v: number) => formatNumber(v, 0); // label crosshair: satuan sudah di judul, label harus muat di lebar sumbu

  return (
    <ChartFrame
      title={hasBattery ? "Battery SOC & Tariff" : "Tariff"}
      unit={hasBattery ? "(% · Rp/kWh)" : "(Rp/kWh)"}
      legend={
        <div className="flex flex-wrap items-center">
          <ChartLegend series={series} hidden={hidden} onToggle={toggle} />
          {outages.length > 0 && <OutageLegendItem />}
        </div>
      }
      zoom={{ zoomed: !isFullDay(window), onReset, rangeLabel: `${formatMinutes(window[0])}–${formatMinutes(window[1])}` }}
      table={
        visible && (
          <ChartTable
            caption={nowMinutes !== undefined ? "SOC every minute and the tariff in force" : "SOC every 5 minutes and the tariff in force"}
            columns={[`Time (${timezoneAbbrev})`, ...(hasBattery ? ["SOC (%)"] : []), "Purchase (Rp/kWh)", "Feed-in (Rp/kWh)"]}
            rows={visible.map((p) => [formatMinutes(p.t), ...(hasBattery ? [p.soc ?? "–"] : []), p.purchase === undefined ? "–" : formatNumber(p.purchase, 2), p.feedIn === undefined ? "–" : formatNumber(p.feedIn, 2)])}
          />
        )
      }
    >
      {loading || !points ? (
        <Skeleton className="h-60 w-full" />
      ) : points.length === 0 ? (
        <p className="grid place-items-center text-sm text-muted" style={{ height: HEIGHT }}>
          No SOC or tariff data for this date yet.
        </p>
      ) : (
        <div {...frameProps}>
          <ResponsiveContainer width="100%" height={HEIGHT}>
            <ComposedChart data={points} margin={{ top: 20, right: 8, left: 8, bottom: 6 }} syncId="daily" accessibilityLayer {...mouse} className="select-none">
              <defs>
                <linearGradient id="soc-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={SERIES_COLOR.soc} stopOpacity={0.38} />
                  <stop offset="100%" stopColor={SERIES_COLOR.soc} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
              <XAxis type="number" dataKey="t" domain={[window[0], window[1]]} allowDataOverflow ticks={zoomTicks(window)} tickFormatter={formatMinutes} tick={AXIS_TICK} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} minTickGap={28} />
              {hasBattery && <YAxis yAxisId="soc" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v: number) => `${v}%`} tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} />}
              <YAxis yAxisId="tariff" orientation={hasBattery ? "right" : "left"} domain={[0, "auto"]} tickFormatter={compactNumber} tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} />
              {outageAreas(outages, "tariff")}
              <Tooltip
                cursor={false}
                offset={16}
                content={({ active, payload, label }: TooltipProps<number, string>) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0]?.payload as SocTariffPoint;
                  const rows: TooltipRow[] = [];
                  if (hasBattery && !hidden.has("soc") && p.soc !== undefined) rows.push({ key: "soc", value: `${formatNumber(p.soc, 0)} %` });
                  for (const k of TARIFF) {
                    const v = p[k];
                    if (!hidden.has(k) && v !== undefined) rows.push({ key: k, value: `Rp ${formatNumber(v, 2)}` });
                  }
                  return rows.length ? <ChartTooltipBox title={`${formatMinutes(Number(label))} (${timezoneAbbrev})`} rows={rows} /> : null;
                }}
              />
              {hasBattery && (
                <Area
                  yAxisId="soc"
                  type="monotone"
                  dataKey="soc"
                  name={SERIES_LABEL.soc}
                  hide={hidden.has("soc")}
                  connectNulls
                  stroke={SERIES_COLOR.soc}
                  strokeWidth={2}
                  fill="url(#soc-fill)"
                  fillOpacity={1}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_CHROME.surface }}
                  isAnimationActive={false}
                />
              )}
              {TARIFF.map((k) => (
                <Line
                  key={k}
                  yAxisId="tariff"
                  type="stepAfter"
                  dataKey={k}
                  name={SERIES_LABEL[k]}
                  hide={hidden.has(k)}
                  connectNulls
                  stroke={SERIES_COLOR[k]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_CHROME.surface }}
                  isAnimationActive={false}
                />
              ))}
              {nowMinutes !== undefined && (
                <ReferenceLine yAxisId="tariff" x={nowMinutes} stroke={CHART_CHROME.marker} strokeDasharray="4 4" label={{ value: "Now", position: "top", fill: CHART_CHROME.ink, fontSize: 11 }} />
              )}
              <Customized
                component={(props: CustomizedProps) => (
                  <Crosshair
                    {...props}
                    hover={crosshair.hover}
                    formatX={formatMinutes}
                    yAxisId={hasBattery ? "soc" : "tariff"}
                    formatY={hasBattery ? (v) => `${formatNumber(v, 0)}%` : plain}
                    right={hasBattery ? { axisId: "tariff", format: plain } : undefined}
                  />
                )}
              />
              {selection && <ReferenceArea yAxisId="tariff" x1={selection[0]} x2={selection[1]} fill="var(--color-brand)" fillOpacity={0.12} stroke="var(--color-brand)" strokeOpacity={0.6} />}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartFrame>
  );
}
