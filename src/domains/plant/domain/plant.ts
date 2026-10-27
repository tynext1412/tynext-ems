import type { GeoPoint } from "@/shared/domain/geo";
import type { KW, KWh, KWp } from "@/shared/domain/units";

export type PlantId = string;

export type PlantStatus = "ONLINE" | "ALARM" | "OFFLINE";

export const PLANT_STATUSES: readonly PlantStatus[] = ["ONLINE", "ALARM", "OFFLINE"];

export const PLANT_STATUS_LABEL: Record<PlantStatus, string> = {
  ONLINE: "Online",
  ALARM: "Alarm",
  OFFLINE: "Offline",
};

export type DeviceType = "INVERTER" | "BATTERY" | "PCS" | "METER" | "LOGGER";

export interface Device {
  id: string;
  type: DeviceType;
  vendor: string;
  connected: boolean;
  activeAlarms: number;
}

export interface Owner {
  id: string;
  name: string;
  contactEmail: string;
}

export interface Capacity {
  pvKWp: KWp;
  inverterKW: KW;
  batteryKWh: KWh;
}

export interface Location {
  point: GeoPoint;
  address: string;
  timezone: string; // IANA, mis. Asia/Jakarta
}

export type WeatherCondition = "CLEAR" | "PARTLY_CLOUDY" | "CLOUDY" | "RAIN" | "THUNDERSTORM";

export interface WeatherSnapshot {
  condition: WeatherCondition;
  temperatureC: number;
  observedAt: string; // ISO 8601
}

export interface WeatherForecastDay {
  date: string; // YYYY-MM-DD, tanggal lokal plant
  condition: WeatherCondition;
  minTemperatureC: number;
  maxTemperatureC: number;
}

// Field mengikuti spesifikasi "Weather Information".
export interface WeatherToday extends WeatherForecastDay {
  temperatureC: number; // suhu saat ini
  sunrise: string; // HH:mm waktu lokal plant
  sunset: string;
  windDirection: string; // arah kompas, mis. NNW
  windSpeedMs: number;
  humidityPercent: number;
}

export interface WeatherReport {
  today: WeatherToday;
  forecast: WeatherForecastDay[]; // termasuk hari ini di indeks 0
}

// Jenis site menentukan adegan 3D di diagram aliran energi.
export type PlantType = "RESORT_HOTEL" | "MINING" | "PLANTATION";

export const PLANT_TYPES: readonly PlantType[] = ["RESORT_HOTEL", "MINING", "PLANTATION"];

export const PLANT_TYPE_LABEL: Record<PlantType, string> = {
  RESORT_HOTEL: "Resort / Hotel",
  MINING: "Mining",
  PLANTATION: "Plantation",
};

// Plant adalah aggregate root context Plant. `status` diturunkan dari devices
// lewat status-policy di boundary (repository), bukan diisi bebas oleh UI.
export interface Plant {
  id: PlantId;
  name: string;
  plantType: PlantType;
  location: Location;
  owner: Owner;
  installer: string;
  organization?: string; // organisasi yang ditugaskan mengelola (Assigned Organization)
  capacity: Capacity;
  moduleCount: number;
  modulePowerW: number; // kapasitas per modul (Wp)
  devices: Device[];
  status: PlantStatus;
  weather?: WeatherSnapshot;
  commissionedAt: string; // YYYY-MM-DD, tanggal lokal plant
  gridConnectedAt: string; // YYYY-MM-DD
  platformConnectedAt: string; // YYYY-MM-DD, mulai mengirim data ke platform
  createdAt: string; // ISO 8601, waktu plant dibuat di platform
}
