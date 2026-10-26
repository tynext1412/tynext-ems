import { Cloud, CloudLightning, CloudRain, CloudSun, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { WeatherCondition, WeatherSnapshot } from "../domain/plant";
import { WEATHER_LABEL } from "../domain/weather";

const ICONS: Record<WeatherCondition, LucideIcon> = {
  CLEAR: Sun,
  PARTLY_CLOUDY: CloudSun,
  CLOUDY: Cloud,
  RAIN: CloudRain,
  THUNDERSTORM: CloudLightning,
};

export function WeatherGlyph({ condition, className }: { condition: WeatherCondition; className?: string }) {
  const Icon = ICONS[condition];
  return <Icon className={cn("size-5", className)} aria-label={WEATHER_LABEL[condition]} />;
}

export function WeatherIcon({ weather }: { weather?: WeatherSnapshot }) {
  if (!weather) return <span className="text-xs text-muted">n/a</span>;

  const label = `${WEATHER_LABEL[weather.condition]} · ${weather.temperatureC}°C`;
  return (
    <span className="inline-flex items-center gap-2 text-muted" title={label}>
      <WeatherGlyph condition={weather.condition} />
      <span className="font-mono text-xs">{weather.temperatureC}°</span>
    </span>
  );
}
