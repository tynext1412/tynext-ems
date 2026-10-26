import type { PlantId } from "@/domains/plant/domain/plant";
import { useWeatherReport } from "@/domains/plant/application/use-plants";
import { WEATHER_LABEL } from "@/domains/plant/domain/weather";
import { WeatherGlyph } from "@/domains/plant/ui/WeatherIcon";
import { formatNumber } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";

// Field mengikuti spesifikasi "Weather Information": cuaca hari ini, suhu, sunrise/sunset, angin, kelembapan.
export function WeatherCard({ plantId }: { plantId: PlantId }) {
  const { data, isPending, error } = useWeatherReport(plantId);

  return (
    <Panel title="Weather">
      {isPending && <Skeleton className="h-40 w-full" />}
      {error && (
        <p role="alert" className="text-sm text-muted">
          Data cuaca tidak bisa dimuat: {error.message}.
        </p>
      )}
      {!isPending && !error && !data && <p className="text-sm text-muted">Belum ada data cuaca untuk plant ini.</p>}
      {data && (
        <>
          <div className="mb-4 flex items-center gap-3">
            <WeatherGlyph condition={data.today.condition} className="size-8 text-muted" />
            <div>
              <div className="text-sm font-medium">{WEATHER_LABEL[data.today.condition]}</div>
              <div className="font-mono text-2xl font-semibold leading-tight">{data.today.temperatureC}°C</div>
            </div>
          </div>

          <ol className="mb-4 grid grid-cols-5 gap-1 text-center">
            {data.forecast.map((day, i) => (
              <li key={day.date} className={cn("rounded-md py-2", i === 0 && "bg-surface-2")}>
                <div className="text-[11px] text-muted">{i === 0 ? "Hari ini" : day.date.slice(5).replace("-", "/")}</div>
                <WeatherGlyph condition={day.condition} className="mx-auto my-1.5 size-5 text-muted" />
                <div className="font-mono text-xs">
                  {day.maxTemperatureC}°<span className="text-muted">/{day.minTemperatureC}°</span>
                </div>
              </li>
            ))}
          </ol>

          <dl className="grid grid-cols-2 gap-2 text-sm">
            <Item label="Temperature" value={`${data.today.minTemperatureC}~${data.today.maxTemperatureC}°C`} />
            <Item label="Sunrise/Sunset" value={`${data.today.sunrise}/${data.today.sunset}`} />
            <Item label="Wind" value={`${data.today.windDirection} ${formatNumber(data.today.windSpeedMs, 2)} m/s`} />
            <Item label="Humidity" value={`${data.today.humidityPercent}%`} />
          </dl>
        </>
      )}
    </Panel>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-bg px-3 py-2">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className="mt-0.5 font-mono font-semibold">{value}</dd>
    </div>
  );
}
