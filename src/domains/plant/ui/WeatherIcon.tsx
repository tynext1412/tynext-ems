import lightning from "@/assets/figma/lib-icons/cloud-lightning.svg";
import cloudy from "@/assets/figma/weather/berawan.svg";
import partly from "@/assets/figma/weather/cerah-berawan.svg";
import clear from "@/assets/figma/weather/cerah.svg";
import rain from "@/assets/figma/weather/rain.svg";
import { cn } from "@/shared/lib/cn";
import type { WeatherCondition, WeatherSnapshot } from "../domain/plant";
import { WEATHER_LABEL } from "../domain/weather";

// Ikon cuaca dari set "Weather" di Figma (badai petir memakai ikon library).
const ICONS: Record<WeatherCondition, string> = {
  CLEAR: clear,
  PARTLY_CLOUDY: partly,
  CLOUDY: cloudy,
  RAIN: rain,
  THUNDERSTORM: lightning,
};

export function WeatherGlyph({ condition, className }: { condition: WeatherCondition; className?: string }) {
  return <img src={ICONS[condition]} alt={WEATHER_LABEL[condition]} className={cn("size-5", className)} />;
}

export function WeatherIcon({ weather }: { weather?: WeatherSnapshot }) {
  if (!weather) return <span className="text-xs text-muted">–</span>;

  return (
    <span className="inline-flex items-center gap-1.5" title={`${WEATHER_LABEL[weather.condition]} · ${weather.temperatureC}°C`}>
      <WeatherGlyph condition={weather.condition} />
      <span className="font-mono text-sm">{weather.temperatureC}°</span>
    </span>
  );
}
