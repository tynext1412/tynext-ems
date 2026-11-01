import { Cloud } from "lucide-react";
import type { PlantId, WeatherCondition } from "@/domains/plant/domain/plant";
import { useWeatherReport } from "@/domains/plant/application/use-plants";
import { WeatherGlyph } from "@/domains/plant/ui/WeatherIcon";
import { parseDateKey } from "@/shared/domain/time";
import { formatNumber } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Card, Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";

// Label kondisi dalam bahasa Inggris seperti di desain ("Today: Rain").
const CONDITION_EN: Record<WeatherCondition, string> = {
  CLEAR: "Clear",
  PARTLY_CLOUDY: "Partly cloudy",
  CLOUDY: "Cloudy",
  RAIN: "Rain",
  THUNDERSTORM: "Thunderstorm",
};

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });

// Panel Weather: cuaca hari ini + suhu, prakiraan 5 hari, lalu 4 kartu detail.
export function WeatherCard({ plantId }: { plantId: PlantId }) {
  const { data, isPending, error, refetch } = useWeatherReport(plantId);

  return (
    <Panel icon={<Cloud />} title="Weather" cards>
      {isPending && (
        <Card aria-busy>
          <Skeleton className="h-16 w-full" />
          <Skeleton className="mt-3 h-16 w-full" />
        </Card>
      )}
      {error && (
        <Alert
          tone="danger"
          action={
            <Button size="sm" variant="tertiary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        >
          Data cuaca tidak bisa dimuat: {error.message}.
        </Alert>
      )}
      {!isPending && !error && !data && (
        <Card>
          <p className="text-sm text-muted">Belum ada data cuaca untuk plant ini.</p>
        </Card>
      )}
      {data && (
        <>
          <Card className="flex items-center justify-between gap-3 py-3">
            <div>
              <div className="text-sm text-muted">
                Today: <span className="font-medium">{CONDITION_EN[data.today.condition]}</span>
              </div>
              <div className="font-mono text-2xl font-semibold leading-8 text-text">{data.today.temperatureC}°</div>
            </div>
            <WeatherGlyph condition={data.today.condition} className="size-16" />
          </Card>

          <Card className="p-2">
            <ol className="grid grid-cols-5 gap-0.5">
              {data.forecast.map((day, i) => (
                <li key={day.date} className={cn("flex flex-col items-center gap-0.5 rounded-xl px-1 py-1 text-center text-xs text-muted", i === 0 && "bg-surface-3/60")}>
                  <span className="whitespace-nowrap">{i === 0 ? "Today" : DAY_LABEL.format(parseDateKey(day.date))}</span>
                  <WeatherGlyph condition={day.condition} className="size-6" />
                  <span className="whitespace-nowrap font-mono">
                    {day.maxTemperatureC}°/{day.minTemperatureC}°
                  </span>
                </li>
              ))}
            </ol>
          </Card>

          <div className="grid grid-cols-2 gap-1.5">
            <Stat label="Sunrise / Sunset" value={`${data.today.sunrise} / ${data.today.sunset}`} />
            <Stat label="Wind" value={`${data.today.windDirection} ${formatNumber(data.today.windSpeedMs, 2)} m/s`} />
            <Stat label="Humidity" value={`${data.today.humidityPercent}%`} />
            <Stat label="Temperature" value={`${data.today.minTemperatureC}–${data.today.maxTemperatureC}°C`} />
          </div>
        </>
      )}
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex h-[70px] flex-col justify-center gap-0.5 py-0">
      <div className="text-xs text-muted">{label}</div>
      <div className={cn("font-mono font-semibold leading-tight text-text", value.length > 11 ? "text-sm" : "text-base")}>{value}</div>
    </Card>
  );
}
