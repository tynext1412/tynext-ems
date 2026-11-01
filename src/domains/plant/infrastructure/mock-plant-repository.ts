import { addDays, hashSeed, toDateKey } from "@/shared/domain/time";
import type { PlantRepository } from "../application/plant-repository";
import type { Plant, PlantId, WeatherCondition, WeatherForecastDay, WeatherReport } from "../domain/plant";
import { applyInfo, validateInfo, type PlantInfoUpdate } from "../domain/plant-info";
import { derivePlantStatus } from "../domain/status-policy";
import { plantFixtures, type PlantFixture } from "./fixtures";

const SIMULATED_LATENCY_MS = 350;
const FORECAST_DAYS = 5;
const CONDITIONS: WeatherCondition[] = ["CLEAR", "PARTLY_CLOUDY", "CLOUDY", "RAIN", "THUNDERSTORM"];
const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

// Matahari terbit/terbenam dummy per zona (Indonesia dekat khatulistiwa, variasi kecil).
const SUN_BY_ZONE: Record<string, [string, string]> = {
  "Asia/Jakarta": ["05:45", "17:50"],
  "Asia/Makassar": ["05:40", "18:00"],
  "Asia/Jayapura": ["05:30", "17:45"],
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Adapter mock untuk port PlantRepository. Menurunkan status lewat domain
// policy, sama seperti yang nanti dilakukan mapper HTTP terhadap DTO backend.
export class MockPlantRepository implements PlantRepository {
  private readonly plants: Plant[];

  constructor(
    fixtures: PlantFixture[] = plantFixtures,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.plants = fixtures.map((f) => ({ ...f, status: derivePlantStatus(f.devices) }));
  }

  async findAll(): Promise<Plant[]> {
    await delay(SIMULATED_LATENCY_MS);
    return this.plants.map(clone);
  }

  async findById(id: PlantId): Promise<Plant | null> {
    await delay(SIMULATED_LATENCY_MS);
    const found = this.plants.find((p) => p.id === id);
    return found ? clone(found) : null;
  }

  async updateInfo(id: PlantId, info: PlantInfoUpdate): Promise<Plant> {
    await delay(SIMULATED_LATENCY_MS);
    const index = this.plants.findIndex((p) => p.id === id);
    if (index < 0) throw new Error(`Plant ${id} not found`);
    if (Object.keys(validateInfo(info)).length > 0) throw new Error("Invalid plant data");
    this.plants[index] = applyInfo(this.plants[index], info);
    return clone(this.plants[index]);
  }

  // Cuaca dummy: hari ini dari snapshot fixture, prakiraan bergeser deterministik per tanggal.
  async weatherReport(id: PlantId): Promise<WeatherReport | null> {
    await delay(SIMULATED_LATENCY_MS);
    const plant = this.plants.find((p) => p.id === id);
    if (!plant) return null;

    const tz = plant.location.timezone;
    const today = toDateKey(this.now(), tz);
    const baseIndex = CONDITIONS.indexOf(plant.weather?.condition ?? "PARTLY_CLOUDY");
    const baseTemp = plant.weather?.temperatureC ?? 30;

    const forecast: WeatherForecastDay[] = Array.from({ length: FORECAST_DAYS }, (_, i) => {
      const date = addDays(today, i);
      const seed = hashSeed(`${id}:${date}`);
      const shift = (seed % 3) - 1; // -1, 0, +1 langkah kondisi
      const condition = CONDITIONS[Math.min(CONDITIONS.length - 1, Math.max(0, baseIndex + (i === 0 ? 0 : shift)))];
      const spread = 5 + (seed % 3);
      return {
        date,
        condition,
        minTemperatureC: Math.round(baseTemp - spread),
        maxTemperatureC: Math.round(baseTemp + ((seed >>> 3) % 3) - 1),
      };
    });

    const seed = hashSeed(`${id}:${today}:wx`);
    const [sunrise, sunset] = SUN_BY_ZONE[tz] ?? ["05:45", "17:50"];
    return {
      today: {
        ...forecast[0],
        temperatureC: baseTemp,
        sunrise,
        sunset,
        windDirection: COMPASS[seed % COMPASS.length],
        windSpeedMs: Math.round((1 + ((seed >>> 4) % 50) / 10) * 100) / 100,
        humidityPercent: 55 + ((seed >>> 9) % 36),
      },
      forecast,
    };
  }
}

function clone(plant: Plant): Plant {
  return structuredClone(plant);
}
