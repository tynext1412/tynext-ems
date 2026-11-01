export type Daypart = "day" | "night";

export const DAY_START_HOUR = 6; // 06:00 waktu lokal perangkat
export const NIGHT_START_HOUR = 18; // 18:00

// Latar video halaman login: "day" dari pukul 06.00 sampai sebelum 18.00, selebihnya "night".
export function daypartAt(date: Date): Daypart {
  const hour = date.getHours();
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? "day" : "night";
}
