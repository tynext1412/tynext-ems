import type { WeatherCondition } from "./plant";

export const WEATHER_LABEL: Record<WeatherCondition, string> = {
  CLEAR: "Clear",
  PARTLY_CLOUDY: "Partly cloudy",
  CLOUDY: "Cloudy",
  RAIN: "Rain",
  THUNDERSTORM: "Thunderstorm",
};
