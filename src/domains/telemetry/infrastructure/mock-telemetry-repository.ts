import type { PlantId } from "@/domains/plant/domain/plant";
import { derivePlantStatus, inverterAvailability } from "@/domains/plant/domain/status-policy";
import { plantFixtures, type PlantFixture } from "@/domains/plant/infrastructure/fixtures";
import { hashSeed, localMidnightUtc, toDateKey } from "@/shared/domain/time";
import type { TelemetryRepository } from "../application/telemetry-repository";
import type { PowerSample, PowerSnapshot } from "../domain/power-snapshot";

const SIMULATED_LATENCY_MS = 200;
const SAMPLE_MINUTES = 5;
const SAMPLES_PER_DAY = (24 * 60) / SAMPLE_MINUTES;

// Kurva irradiansi sederhana: nol di luar 06:00–18:00, puncak di tengah hari.
function irradiance(hour: number): number {
  if (hour < 6 || hour > 18) return 0;
  return Math.sin(((hour - 6) / 12) * Math.PI);
}

// Jitter kecil per sampel supaya angka "hidup" tapi tetap deterministik.
function jitter(seed: number, amplitude: number): number {
  return 1 + ((seed % 1000) / 1000 - 0.5) * 2 * amplitude;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Model daya satu titik waktu; dipakai snapshot terbaru dan deret harian.
function model(fixture: PlantFixture, hour: number, seed: number, at: Date): PowerSample {
  const inverter = inverterAvailability(fixture.devices);
  const availability = inverter.total > 0 ? inverter.online / inverter.total : 1;
  const hasBattery = fixture.capacity.batteryKWh > 0;
  const maxBatteryKW = fixture.capacity.batteryKWh * 0.5;

  const pvKW = fixture.capacity.pvKWp * 0.8 * irradiance(hour) * availability * jitter(seed, 0.04);
  const loadKW = fixture.capacity.inverterKW * (0.45 + 0.2 * irradiance(hour)) * jitter(seed >>> 2, 0.05);

  // Spesifikasi: charge +, discharge −.
  let batteryKW = 0;
  if (hasBattery) {
    const surplus = pvKW - loadKW;
    batteryKW = surplus > 0 ? Math.min(surplus, maxBatteryKW) : -Math.min(-surplus, maxBatteryKW);
  }
  const gridKW = loadKW - pvKW + batteryKW; // sisa neraca; + impor, − ekspor
  const socPercent = hasBattery ? Math.round(40 + 55 * irradiance(Math.max(6, hour - 2))) : 0;

  return {
    at: at.toISOString(),
    pvKW: round1(pvKW),
    loadKW: round1(loadKW),
    gensetKW: 0,
    batteryKW: round1(batteryKW),
    gridKW: round1(gridKW),
    socPercent,
  };
}

export class MockTelemetryRepository implements TelemetryRepository {
  private readonly fixtures: Map<PlantId, PlantFixture>;

  constructor(
    fixtures: PlantFixture[] = plantFixtures,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.fixtures = new Map(fixtures.map((f) => [f.id, f]));
  }

  async latest(plantId: PlantId): Promise<PowerSnapshot | null> {
    await delay(SIMULATED_LATENCY_MS);
    const fixture = this.fixtures.get(plantId);
    if (!fixture) return null;

    const now = this.now();
    if (derivePlantStatus(fixture.devices) === "OFFLINE") {
      // Tidak ada data baru; snapshot terakhir dari 40 menit lalu.
      return { plantId, at: new Date(now.getTime() - 40 * 60_000).toISOString(), pvKW: 0, loadKW: 0, gensetKW: 0, batteryKW: 0, gridKW: 0, socPercent: 42 };
    }

    const series = this.seriesFor(fixture, toDateKey(now, fixture.location.timezone), now);
    const last = series[series.length - 1];
    return { plantId, ...last, at: now.toISOString() };
  }

  async dailySeries(plantId: PlantId, date: string): Promise<PowerSample[]> {
    await delay(SIMULATED_LATENCY_MS);
    const fixture = this.fixtures.get(plantId);
    if (!fixture) return [];
    return this.seriesFor(fixture, date, this.now());
  }

  // Sampel 5 menit dari tengah malam lokal sampai sekarang (hari ini) atau sehari penuh.
  private seriesFor(fixture: PlantFixture, date: string, now: Date): PowerSample[] {
    const start = localMidnightUtc(date, fixture.location.timezone);
    const offline = derivePlantStatus(fixture.devices) === "OFFLINE";
    const cutoff = offline ? now.getTime() - 40 * 60_000 : now.getTime();
    const out: PowerSample[] = [];

    for (let i = 0; i < SAMPLES_PER_DAY; i++) {
      const at = new Date(start.getTime() + i * SAMPLE_MINUTES * 60_000);
      if (at.getTime() > cutoff) break;
      const hour = (i * SAMPLE_MINUTES) / 60;
      out.push(model(fixture, hour, hashSeed(`${fixture.id}:${date}:${i}`), at));
    }
    return out;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
