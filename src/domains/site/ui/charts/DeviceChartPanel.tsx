import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { useDeviceDailySeries, useDeviceEnergySeries } from "@/domains/device/application/use-devices";
import { deviceTypeLabel, type DeviceRecord } from "@/domains/device/domain/device";
import { catalogIdFor, DEFAULT_PARAMETERS, groupByUnit, PARAMETER_CATALOGS, type ParameterDef } from "@/domains/device/domain/parameters";
import { GRANULARITIES, type EnergySeriesGranularity, type Period } from "@/domains/performance/domain/performance";
import type { Plant } from "@/domains/plant/domain/plant";
import { useOutageBands } from "@/domains/outage/application/use-outages";
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
import { downloadXlsx } from "@/shared/lib/xlsx";
import { buildDeviceReport, reportFilename } from "../../domain/reports";
import { DownloadReportButton } from "../DownloadReportButton";
import { PeriodControl } from "../PeriodControl";
import { outageAreas } from "./outageAreas";
import { ChartFrame, ChartTable, ChartTooltipBox, OutageLegendItem } from "./ChartChrome";
import { AXIS_TICK, axisNumber, CHART_CHROME } from "./chart-theme";

// Palet kategorikal tervalidasi (dataviz), urutan tetap. Warna parameter = posisinya di dalam
// kelompok satuannya. Hijau #008300 tidak dipakai: di chart Volt inverter (6 seri) ia bersanding
// dengan aqua dan gagal batas beda warna; 6 warna pertama lolos validator di tema terang & gelap.
const PALETTE = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#9085e9", "#e66767"] as const;

function colorFor(catalog: readonly ParameterDef[], param: ParameterDef): string {
  const siblings = catalog.filter((p) => p.unit === param.unit);
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
  const catalogId = catalogIdFor(device);
  const catalog = PARAMETER_CATALOGS[catalogId];

  const [period, setPeriod] = useState<Period>({ granularity: "day", date: today });
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set(DEFAULT_PARAMETERS[catalogId]));
  const isDay = period.granularity === "day";
  const activeKind = isDay ? "instant" : "energy";
  const energyGranularity: EnergySeriesGranularity = period.granularity === "day" ? "month" : period.granularity;

  const daily = useDeviceDailySeries(isDay ? device.id : "", period.date, period.date === today);
  // Semua device plant dibaca satu controller, jadi outage controller berlaku untuk device ini juga.
  const outages = useOutageBands(isDay ? plant.id : "", period.date, tz);
  const energy = useDeviceEnergySeries(isDay ? "" : device.id, energyGranularity, period.date);

  const chosen = useMemo(() => catalog.filter((p) => selected.has(p.key) && p.kind === activeKind), [catalog, selected, activeKind]);
  const groups = useMemo(() => groupByUnit(chosen), [chosen]);

  const dailyPoints = useMemo<DailyPoint[] | undefined>(() => (daily.data ? daily.data.map((s) => ({ ...s.values, t: minutesOfDay(s.at, tz) })) : undefined), [daily.data, tz]);
  const energyPoints = useMemo<EnergyPoint[] | undefined>(() => (energy.data ? energy.data.map((b) => ({ ...b.values, key: b.key, label: bucketLabel(b.key) })) : undefined), [energy.data]);
  const nowMinutes = isDay && period.date === today ? minutesOfDay(new Date().toISOString(), tz) : undefined;
  const loading = isDay ? daily.isPending : energy.isPending;
  const error = isDay ? daily.error : energy.error;

  // Unduh data chart yang sedang tampil (parameter terpilih, periode aktif) + identitas perangkat.
  const downloadReport = () =>
    downloadXlsx(
      reportFilename(device.id, period),
      buildDeviceReport({ device, plant: { id: plant.id, name: plant.name, timezone: tz }, period, generatedAt: new Date(), groups, daily: dailyPoints, energy: energyPoints }),
    );

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
          {deviceTypeLabel(device)} Chart <span className="ml-2 font-mono text-xs font-normal text-muted">SN {device.serialNumber}</span>
        </>
      }
      actions={
        <>
          <DownloadReportButton
            onClick={downloadReport}
            pending={false}
            disabled={loading || groups.length === 0}
            title={groups.length === 0 ? "Select at least one parameter to download" : "Download the device and the charts shown as an Excel file"}
          />
          <PeriodControl period={period} onChange={setPeriod} granularities={GRANULARITIES} minDate={device.commissionedAt} today={today} />
        </>
      }
      cards
      bodyClassName="items-start lg:grid-cols-[280px_minmax(0,1fr)]"
    >
      <Card className="p-3" aria-label="Parameter">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Parameters ({chosen.length})</span>
          <button type="button" onClick={() => setSelected(new Set(DEFAULT_PARAMETERS[catalogId]))} className="text-xs text-accent hover:underline">
            Reset
          </button>
        </div>
        <p className="mb-3 text-xs text-muted">{isDay ? `Day: instantaneous values (${period.date === today ? "every minute" : "every 5 minutes"}).` : "Month/Year/Lifetime: energy values (per day/month/year)."}</p>
        {groupsByName.map(([group, params]) => (
          <fieldset key={group} className="mb-3 min-w-0">
            <legend className="mb-1 text-xs font-medium text-muted">{group}</legend>
            {params.map((p) => {
              const usable = p.kind === activeKind;
              return (
                <label key={p.key} className={cn("flex h-8 cursor-pointer items-center gap-2 text-sm", !usable && "cursor-not-allowed opacity-50")} title={usable ? undefined : isDay ? "Only for Month/Year/Lifetime" : "Only for Day"}>
                  <Checkbox checked={selected.has(p.key)} disabled={!usable} onChange={() => toggle(p.key)} />
                  <span className="size-2 shrink-0 rounded-full" style={{ background: colorFor(catalog, p) }} aria-hidden />
                  <span className="min-w-0 truncate" title={p.label}>{p.label}</span>
                  {p.unit && <span className="ml-auto shrink-0 font-mono text-xs text-muted">{p.unit}</span>}
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
            Chart data couldn't load: {error.message}
          </Alert>
        )}
        {groups.length === 0 && <Card className="grid h-40 place-items-center text-sm text-muted">Select at least one {isDay ? "instantaneous" : "energy"} parameter to show a chart.</Card>}

        {groups.map(({ unit, params }) => (
          <ChartFrame
            key={unit}
            title={unit ? `Unit: ${unit}` : "No unit"}
            legend={
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                {params.map((p) => (
                  <span key={p.key} className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ background: colorFor(catalog, p) }} aria-hidden />
                    {p.label}
                  </span>
                ))}
                {isDay && outages.length > 0 && <OutageLegendItem />}
              </div>
            }
            table={
              isDay
                ? dailyPoints && (
                    <ChartTable caption={`Parameter ${unit}`} columns={[`Time (${abbrev})`, ...params.map((p) => (p.unit ? `${p.label} (${p.unit})` : p.label))]} rows={dailyPoints.map((pt) => [formatMinutes(pt.t), ...params.map((p) => formatNumber(pt[p.key] ?? 0, p.fractionDigits))])} />
                  )
                : energyPoints && (
                    <ChartTable caption={`Parameter ${unit}`} columns={["Period", ...params.map((p) => (p.unit ? `${p.label} (${p.unit})` : p.label))]} rows={energyPoints.map((pt) => [pt.key, ...params.map((p) => formatNumber(Number(pt[p.key] ?? 0), p.fractionDigits))])} />
                  )
            }
          >

            {loading || (isDay ? !dailyPoints : !energyPoints) ? (
              <Skeleton className="h-50 w-full" />
            ) : isDay ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={dailyPoints} margin={{ top: 16, right: 12, left: 0, bottom: 0 }} syncId={`device-${device.id}`} accessibilityLayer>
                  <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
                  {outageAreas(outages)}
                  <XAxis type="number" dataKey="t" domain={[0, 1440]} ticks={zoomTicks(FULL_DAY)} tickFormatter={formatMinutes} tick={AXIS_TICK} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} minTickGap={28} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} tickFormatter={axisNumber} domain={unit === "%" ? [0, 100] : ["auto", "auto"]} />
                  <Tooltip
                    cursor={{ stroke: CHART_CHROME.marker, strokeWidth: 1 }}
                    content={({ active, payload, label }: TooltipProps<number, string>) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0]?.payload as Record<string, number>;
                      return <ChartTooltipBox title={`${formatMinutes(Number(label))} ${abbrev}`} rows={params.map((p) => ({ key: "grid", color: colorFor(catalog, p), label: p.label, value: `${formatNumber(row[p.key] ?? 0, p.fractionDigits)} ${p.unit}`.trim() }))} />;
                    }}
                  />
                  {params.map((p) => (
                    <Line key={p.key} type="monotone" dataKey={p.key} name={p.label} stroke={colorFor(catalog, p)} strokeWidth={2} dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_CHROME.surface }} isAnimationActive={false} />
                  ))}
                  {nowMinutes !== undefined && <ReferenceLine x={nowMinutes} stroke={CHART_CHROME.marker} strokeDasharray="4 4" label={{ value: "Now", position: "top", fill: CHART_CHROME.ink, fontSize: 11 }} />}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={energyPoints} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="30%" syncId={`device-${device.id}`} accessibilityLayer>
                  <CartesianGrid stroke={CHART_CHROME.grid} vertical={false} />
                  <XAxis dataKey="label" tick={AXIS_TICK} axisLine={{ stroke: CHART_CHROME.axis }} tickLine={false} interval="preserveStartEnd" minTickGap={12} />
                  <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={48} tickFormatter={axisNumber} />
                  <Tooltip
                    cursor={{ fill: "rgba(0,0,0,0.04)" }}
                    content={({ active, payload, label }: TooltipProps<number, string>) => {
                      if (!active || !payload?.length) return null;
                      const row = payload[0]?.payload as Record<string, number>;
                      return <ChartTooltipBox title={`Period ${label}`} rows={params.map((p) => ({ key: "grid", color: colorFor(catalog, p), label: p.label, value: `${formatNumber(row[p.key] ?? 0, p.fractionDigits)} ${p.unit}` }))} />;
                    }}
                  />
                  {params.map((p) => (
                    <Bar key={p.key} dataKey={p.key} name={p.label} fill={colorFor(catalog, p)} maxBarSize={24} isAnimationActive={false} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}

          </ChartFrame>
        ))}
      </div>
    </Panel>
  );
}
