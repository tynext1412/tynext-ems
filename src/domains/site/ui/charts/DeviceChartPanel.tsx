import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { useDeviceDailySeries, useDeviceEnergySeries } from "@/domains/device/application/use-devices";
import { DEVICE_KIND_LABEL, type DeviceRecord } from "@/domains/device/domain/device";
import { DEFAULT_PARAMETERS, DEVICE_PARAMETERS, groupByUnit, type ParameterDef } from "@/domains/device/domain/parameters";
import { GRANULARITIES, type EnergySeriesGranularity, type Period } from "@/domains/performance/domain/performance";
import type { Plant } from "@/domains/plant/domain/plant";
import { timezoneAbbrev, toDateKey } from "@/shared/domain/time";
import { formatNumber } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Checkbox } from "@/shared/ui/Input";
import { Card, Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { bucketLabel, formatMinutes, minutesOfDay } from "../../domain/chart-data";
import { zoomTicks, FULL_DAY } from "../../domain/period";
import { PeriodControl } from "../PeriodControl";
import { ChartTable, ChartTooltipBox } from "./ChartChrome";
import { AXIS_TICK, CHART_CHROME, compactNumber } from "./chart-theme";

// Palet kategorikal tervalidasi (dataviz), urutan tetap. Warna parameter =
// posisinya di dalam kelompok satuannya, jadi satu chart tidak pernah melewati 8 seri.
const PALETTE = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"] as const;

function colorFor(kind: DeviceRecord["kind"], param: ParameterDef): string {
  const siblings = DEVICE_PARAMETERS[kind].filter((p) => p.unit === param.unit);
  return PALETTE[siblings.indexOf(param) % PALETTE.length];
}

interface Props {
  device: DeviceRecord;
  plant: Plant;
}

type DailyPoint = Record<string, number> & { t: number };
type EnergyPoint = Record<string, number | string> & { key: string; label: string };

// Chart parameter perangkat: checklist parameter, periode Day (deret 5 menit) atau
// Month/Year/Lifetime (batang energi). Satu chart per satuan, berbagi sumbu waktu.
export default function DeviceChartPanel({ device, plant }: Props) {
  const tz = plant.location.timezone;
  const abbrev = timezoneAbbrev(tz);
  const today = toDateKey(new Date(), tz);
  const catalog = DEVICE_PARAMETERS[device.kind];

  const [period, setPeriod] = useState<Period>({ granularity: "day", date: today });
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(DEFAULT_PARAMETERS[device.kind]));
  const isDay = period.granularity === "day";
  const activeKind = isDay ? "instant" : "energy";
  const energyGranularity: EnergySeriesGranularity = period.granularity === "day" ? "month" : period.granularity;

  const daily = useDeviceDailySeries(isDay ? device.id : "", period.date, period.date === today);
  const energy = useDeviceEnergySeries(isDay ? "" : device.id, energyGranularity, period.date);

  const chosen = useMemo(() => catalog.filter((p) => selected.has(p.key) && p.kind === activeKind), [catalog, selected, activeKind]);
  const groups = useMemo(() => groupByUnit(chosen), [chosen]);

  const dailyPoints = useMemo<DailyPoint[] | undefined>(() => (daily.data ? daily.data.map((s) => ({ ...s.values, t: minutesOfDay(s.at, tz) })) : undefined), [daily.data, tz]);
  const energyPoints = useMemo<EnergyPoint[] | undefined>(() => (energy.data ? energy.data.map((b) => ({ ...b.values, key: b.key, label: bucketLabel(b.key) })) : undefined), [energy.data]);
  const nowMinutes = isDay && period.date === today ? minutesOfDay(new Date().toISOString(), tz) : undefined;
  const loading = isDay ? daily.isPending : energy.isPending;
  const error = isDay ? daily.error : energy.error;

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const groupsByName = useMemo(() => {
    const m = new Map<string, ParameterDef[]>();
    for (const p of catalog) m.set(p.group, [...(m.get(p.group) ?? []), p]);
    return [...m.entries()];
  }, [catalog]);

  return (
    <Panel
      title={
        <>
          {DEVICE_KIND_LABEL[device.kind]} Chart <span className="ml-2 font-mono text-xs font-normal text-muted">SN {device.serialNumber}</span>
        </>
      }
      actions={<PeriodControl period={period} onChange={setPeriod} granularities={GRANULARITIES} minDate={device.commissionedAt} today={today} />}
      cards
      bodyClassName="items-start lg:grid-cols-[240px_minmax(0,1fr)]"
    >
      <Card className="p-3" aria-label="Parameter">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Parameters ({chosen.length})</span>
          <button type="button" onClick={() => setSelected(new Set(DEFAULT_PARAMETERS[device.kind]))} className="text-xs text-accent hover:underline">
            Reset
          </button>
        </div>
        <p className="mb-3 text-xs text-muted">{isDay ? "Day: parameter sesaat (per 5 menit)." : "Month/Year/Lifetime: parameter energi (per hari/bulan/tahun)."}</p>
        {groupsByName.map(([group, params]) => (
          <fieldset key={group} className="mb-3">
            <legend className="mb-1 text-xs font-medium text-muted">{group}</legend>
            {params.map((p) => {
              const usable = p.kind === activeKind;
              return (
                <label key={p.key} className={cn("flex h-8 cursor-pointer items-center gap-2 text-sm", !usable && "cursor-not-allowed opacity-50")} title={usable ? undefined : isDay ? "Hanya untuk Month/Year/Lifetime" : "Hanya untuk Day"}>
                  <Checkbox checked={selected.has(p.key)} disabled={!usable} onChange={() => toggle(p.key)} />
                  <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ background: colorFor(device.kind, p) }} aria-hidden />
                  <span className="truncate">{p.label}</span>
                  {p.unit && <span className="ml-auto font-mono text-xs text-muted">{p.unit}</span>}
                </label>
              );
            })}
          </fieldset>
        ))}
      </Card>

      <div className="grid min-w-0 gap-1.5">
        {error && (
          <Alert
            tone="danger"
            action={
              <Button size="sm" variant="tertiary" onClick={() => void (isDay ? daily.refetch() : energy.refetch())}>
                Retry
              </Button>
            }
          >
            Data chart tidak bisa dimuat: {error.message}
          </Alert>
        )}
        {groups.length === 0 && <Card className="grid h-40 place-items-center text-sm text-muted">Centang minimal satu parameter {isDay ? "sesaat" : "energi"} untuk menampilkan chart.</Card>}

        {groups.map(({ unit, params }) => (
          <Card key={unit} aria-label={`Chart ${unit || "tanpa satuan"}`}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">{unit ? `Satuan ${unit}` : "Tanpa satuan"}</h3>
              <div className="flex flex-wrap gap-x-4 text-xs text-muted">
                {params.map((p) => (
                  <span key={p.key} className="flex items-center gap-2">
                    <span className="h-0.5 w-4 rounded-full" style={{ background: colorFor(device.kind, p) }} aria-hidden />
                    {p.label}
                  </span>
                ))}
              </div>
            </div>

            {loading || (isDay ? !dailyPoints : !energyPoints) ? (
              <Skeleton className="h-50 w-full" />
            ) : isDay ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyPoints} margin={{ top: 16, right: 12, left: 0, bottom: 0 }} syncId={`device-${device.id}`} accessibilityLayer>
                  <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
                  <XAxis type="number" dataKey="t" domain={[0, 1440]} ticks={zoomTicks(FULL_DAY)} tickFormatter={formatMinutes} tick={AXIS_TICK} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} minTickGap={28} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} tickFormatter={compactNumber} domain={unit === "%" ? [0, 100] : ["auto", "auto"]} />
                  <Tooltip
                    cursor={{ stroke: CHART_CHROME.marker, strokeWidth: 1 }}
                    content={({ active, payload, label }: TooltipProps<number, string>) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0]?.payload as Record<string, number>;
                      return <ChartTooltipBox title={`${formatMinutes(Number(label))} ${abbrev}`} rows={params.map((p) => ({ key: "grid", color: colorFor(device.kind, p), label: p.label, value: `${formatNumber(row[p.key] ?? 0, p.fractionDigits)} ${p.unit}` }))} />;
                    }}
                  />
                  {params.map((p) => (
                    <Line key={p.key} type="monotone" dataKey={p.key} name={p.label} stroke={colorFor(device.kind, p)} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_CHROME.surface }} isAnimationActive={false} />
                  ))}
                  {nowMinutes !== undefined && <ReferenceLine x={nowMinutes} stroke={CHART_CHROME.marker} strokeDasharray="4 4" label={{ value: "Now", position: "top", fill: CHART_CHROME.ink, fontSize: 11 }} />}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={energyPoints} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="30%" syncId={`device-${device.id}`} accessibilityLayer>
                  <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
                  <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} interval="preserveStartEnd" minTickGap={12} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} tickFormatter={compactNumber} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    content={({ active, payload, label }: TooltipProps<number, string>) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0]?.payload as Record<string, number>;
                      return <ChartTooltipBox title={`Periode ${label}`} rows={params.map((p) => ({ key: "grid", color: colorFor(device.kind, p), label: p.label, value: `${formatNumber(row[p.key] ?? 0, p.fractionDigits)} ${p.unit}` }))} />;
                    }}
                  />
                  {params.map((p) => (
                    <Bar key={p.key} dataKey={p.key} name={p.label} fill={colorFor(device.kind, p)} maxBarSize={24} isAnimationActive={false} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}

            {isDay && dailyPoints && (
              <ChartTable caption={`Parameter ${unit}`} columns={[`Waktu (${abbrev})`, ...params.map((p) => `${p.label} (${p.unit})`)]} rows={dailyPoints.map((pt) => [formatMinutes(pt.t), ...params.map((p) => formatNumber(pt[p.key] ?? 0, p.fractionDigits))])} />
            )}
            {!isDay && energyPoints && (
              <ChartTable caption={`Parameter ${unit}`} columns={["Periode", ...params.map((p) => `${p.label} (${p.unit})`)]} rows={energyPoints.map((pt) => [pt.key, ...params.map((p) => formatNumber(Number(pt[p.key] ?? 0), p.fractionDigits))])} />
            )}
          </Card>
        ))}
      </div>
    </Panel>
  );
}
