import type { WeatherCondition } from "./plant";

export const WEATHER_LABEL: Record<WeatherCondition, string> = {
  CLEAR: "Cerah",
  PARTLY_CLOUDY: "Berawan sebagian",
  CLOUDY: "Berawan",
  RAIN: "Hujan",
  THUNDERSTORM: "Badai petir",
};
