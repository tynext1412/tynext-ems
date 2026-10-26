import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { Skeleton } from "@/shared/ui/Skeleton";
import { formatMinutes, type DailyPowerPoint } from "../../domain/chart-data";
import { zoomTicks, type TimeWindow } from "../../domain/period";
import { ChartFrame, ChartTable, ChartTooltipBox } from "./ChartChrome";
import { AXIS_TICK, CHART_CHROME, SERIES_COLOR } from "./chart-theme";
import { useDragZoom } from "./useDragZoom";

interface Props {
  points: DailyPowerPoint[] | undefined;
  loading: boolean;
  nowMinutes?: number;
  timezoneAbbrev: string;
  hasBattery: boolean;
  window: TimeWindow;
  onZoom: (from: number, to: number) => void;
}

// SOC 0–100 % sepanjang hari; satu seri, jadi tanpa kotak legenda (judul sudah menyebutnya).
export function SocChart({ points, loading, nowMinutes, timezoneAbbrev, hasBattery, window, onZoom }: Props) {
  const { selection, handlers } = useDragZoom(onZoom);
  const visible = points?.filter((p) => p.t >= window[0] && p.t <= window[1]);

  return (
    <ChartFrame
      title="State of charge baterai (%)"
      table={visible && hasBattery && <ChartTable caption="SOC per 5 menit" columns={[`Waktu (${timezoneAbbrev})`, "SOC (%)"]} rows={visible.map((p) => [formatMinutes(p.t), p.soc])} />}
    >
      {!hasBattery ? (
        <p className="grid h-50 place-items-center text-sm text-muted">Plant ini tidak memiliki BESS.</p>
      ) : loading || !points ? (
        <Skeleton className="h-50 w-full" />
      ) : points.length === 0 ? (
        <p className="grid h-50 place-items-center text-sm text-muted">Belum ada sampel SOC untuk tanggal ini.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} syncId="daily" accessibilityLayer {...handlers} className="select-none">
            <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
            <XAxis type="number" dataKey="t" domain={[window[0], window[1]]} allowDataOverflow ticks={zoomTicks(window)} tickFormatter={formatMinutes} tick={AXIS_TICK} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} minTickGap={28} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={AXIS_TICK} axisLine={false} tickLine={false} width={44} />
            <Tooltip
              cursor={{ stroke: CHART_CHROME.marker, strokeWidth: 1 }}
              content={({ active, payload, label }: TooltipProps<number, string>) =>
                active && payload?.length ? <ChartTooltipBox title={`${formatMinutes(Number(label))} ${timezoneAbbrev}`} rows={[{ key: "battery", value: `SOC ${payload[0]?.value} %` }]} /> : null
              }
            />
            <Area type="monotone" dataKey="soc" name="SOC" stroke={SERIES_COLOR.battery} strokeWidth={2} fill={SERIES_COLOR.battery} fillOpacity={0.1} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_CHROME.surface }} isAnimationActive={false} />
            {nowMinutes !== undefined && <ReferenceLine x={nowMinutes} stroke={CHART_CHROME.marker} strokeDasharray="4 4" />}
            {selection && <ReferenceArea x1={selection[0]} x2={selection[1]} fill="var(--color-copper)" fillOpacity={0.12} stroke="var(--color-copper)" strokeOpacity={0.6} />}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </ChartFrame>
  );
}
