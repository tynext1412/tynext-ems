import type { PlantId } from "@/domains/plant/domain/plant";
import { derivePlantStatus } from "@/domains/plant/domain/status-policy";
import type { PlantFixture } from "@/domains/plant/infrastructure/fixtures";
import { plantFixtures } from "@/domains/plant/infrastructure/fixtures";
import { addDays, daysBetween, hashSeed, localMidnightUtc, toDateKey } from "@/shared/domain/time";
import type { PerformanceRepository } from "../application/performance-repository";
import type { EnergyBucket, EnergySeriesGranularity, OperatingData, OperatingDataQuery, PlantPerformance, TariffPoint } from "../domain/performance";

const SIMULATED_LATENCY_MS = 500;
const DAY_MS = 86_400_000;

// Tarif jual (feed-in / PPA) dummy per plant, Rp/kWh.
const TARIFF_BY_PLANT: Record<string, number> = {
  "PLT-001": 1444.7, "PLT-002": 1114.74, "PLT-003": 1035.78, "PLT-004": 1444.7, "PLT-005": 1444.7,
  "PLT-006": 1114.74, "PLT-007": 1114.74, "PLT-008": 1750, "PLT-009": 1444.7, "PLT-010": 1114.74,
  "PLT-011": 1444.7, "PLT-012": 1699.53, "PLT-013": 1035.78, "PLT-014": 1444.7,
};
const DEFAULT_TARIFF = 1444.7;

// Tarif beli dari PLN (dummy): LWBP flat, WBP 17:00–22:00 dikalikan faktor K.
const PURCHASE_LWBP = 1444.7;
const PURCHASE_WBP_FACTOR = 1.4;

// PRNG deterministik (mulberry32) supaya angka dummy stabil antar reload.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Variasi cuaca harian 0,75–1,15, deterministik per plant + tanggal.
function dailyFactor(plantId: string, date: string): number {
  return 0.75 + mulberry32(hashSeed(`${plantId}:${date}`))() * 0.4;
}

// Energi dummy lifetime: ~3,6 kWh/kWp/hari (peak sun hours Indonesia) sejak
// commissioning, BESS satu siklus/hari dengan round-trip efficiency 92%.
function buildPerformance(fixture: PlantFixture, index: number, now: Date): PlantPerformance {
  const random = mulberry32(index + 1);
  const days = Math.max(1, Math.floor((now.getTime() - new Date(fixture.commissionedAt).getTime()) / DAY_MS));
  const weatherFactor = 0.85 + random() * 0.2;

  const generationKWh = fixture.capacity.pvKWp * 3.6 * weatherFactor * days;
  const chargeKWh = fixture.capacity.batteryKWh * 0.85 * weatherFactor * days;
  const dischargeKWh = chargeKWh * 0.92;
  const tariffIDRPerKWh = TARIFF_BY_PLANT[fixture.id] ?? DEFAULT_TARIFF;

  return {
    plantId: fixture.id,
    generationKWh: round2(generationKWh),
    chargeKWh: round2(chargeKWh),
    dischargeKWh: round2(dischargeKWh),
    tariffIDRPerKWh,
    purchaseTariffIDRPerKWh: PURCHASE_LWBP,
    revenueIDR: round2(generationKWh * tariffIDRPerKWh),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Energi satu hari lokal, konsisten dengan model daya di mock telemetri:
// beban ≈ kapasitas inverter × (0,45 + 0,2 × irradiansi) selama 24 jam.
interface DayEnergy {
  pv: number;
  charge: number;
  discharge: number;
  load: number;
  grid: number;
  hours: number;
}

function dayEnergy(fixture: PlantFixture, lifetime: PlantPerformance, lifetimeDays: number, date: string, offline: boolean): DayEnergy {
  if (offline) return { pv: 0, charge: 0, discharge: 0, load: 0, grid: 0, hours: 0 };
  const f = dailyFactor(fixture.id, date);
  const pv = (lifetime.generationKWh / lifetimeDays) * f;
  const charge = (lifetime.chargeKWh / lifetimeDays) * f;
  const discharge = charge * 0.92;
  const load = fixture.capacity.inverterKW * (0.45 * 24 + 0.2 * 7.6) * (0.95 + 0.1 * (f - 0.75));
  const grid = Math.max(0, load + charge - pv - discharge);
  const hours = 10.5 + 2 * (f - 0.75); // jam PV menghasilkan daya
  return { pv, charge, discharge, load, grid, hours };
}

export class MockPerformanceRepository implements PerformanceRepository {
  private readonly items: PlantPerformance[];
  private readonly fixtures: Map<string, PlantFixture>;

  constructor(
    fixtures: PlantFixture[] = plantFixtures,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.items = fixtures.map((f, i) => buildPerformance(f, i, now()));
    this.fixtures = new Map(fixtures.map((f) => [f.id, f]));
  }

  async findAll(): Promise<PlantPerformance[]> {
    await delay(SIMULATED_LATENCY_MS);
    return this.items.map((p) => ({ ...p }));
  }

  // Day/month/year dijumlahkan dari rata-rata harian lifetime × variasi per
  // tanggal, supaya konsisten dengan angka lifetime di tabel fleet.
  async operatingData(query: OperatingDataQuery): Promise<OperatingData> {
    await delay(SIMULATED_LATENCY_MS);
    const ctx = this.context(query.plantId);
    if (!ctx) return { pvProductionKWh: 0, bessChargeKWh: 0, bessDischargeKWh: 0, dieselGeneratorKWh: 0, loadConsumptionKWh: 0, dayOperation: 0, hoursOperation: 0, revenueIDR: 0 };

    const { fixture, lifetime, today, lifetimeDays, offlineToday } = ctx;
    const dates = query.granularity === "lifetime" ? datesIn({ ...query, granularity: "year", date: fixture.commissionedAt }, fixture.commissionedAt, today, true) : datesIn(query, fixture.commissionedAt, today);

    let pv = 0, charge = 0, discharge = 0, load = 0, hours = 0, days = 0;
    for (const date of dates) {
      const e = dayEnergy(fixture, lifetime, lifetimeDays, date, offlineToday && date === today);
      pv += e.pv; charge += e.charge; discharge += e.discharge; load += e.load; hours += e.hours;
      if (e.hours > 0) days += 1;
    }

    return {
      pvProductionKWh: round2(pv),
      bessChargeKWh: round2(charge),
      bessDischargeKWh: round2(discharge),
      dieselGeneratorKWh: 0,
      loadConsumptionKWh: round2(load),
      dayOperation: days,
      hoursOperation: round2(hours),
      revenueIDR: round2(pv * lifetime.tariffIDRPerKWh),
    };
  }

  async energySeries(plantId: PlantId, granularity: EnergySeriesGranularity, date: string): Promise<EnergyBucket[]> {
    await delay(SIMULATED_LATENCY_MS);
    const ctx = this.context(plantId);
    if (!ctx) return [];
    const { fixture, lifetime, today, lifetimeDays, offlineToday } = ctx;

    const buckets = new Map<string, EnergyBucket>();
    const keyOf = (d: string) => (granularity === "month" ? d : granularity === "year" ? d.slice(0, 7) : d.slice(0, 4));
    const dates = granularity === "lifetime" ? datesIn({ plantId, granularity: "year", date: fixture.commissionedAt }, fixture.commissionedAt, today, true) : datesIn({ plantId, granularity, date }, fixture.commissionedAt, today);

    for (const d of dates) {
      const e = dayEnergy(fixture, lifetime, lifetimeDays, d, offlineToday && d === today);
      const key = keyOf(d);
      const b = buckets.get(key) ?? { key, pvProductionKWh: 0, gridSupplyKWh: 0, chargeKWh: 0, dischargeKWh: 0, generatorSupplyKWh: 0, loadKWh: 0 };
      b.pvProductionKWh += e.pv; b.gridSupplyKWh += e.grid; b.chargeKWh += e.charge; b.dischargeKWh += e.discharge; b.loadKWh += e.load;
      buckets.set(key, b);
    }

    return [...buckets.values()].map((b) => ({
      ...b,
      pvProductionKWh: round2(b.pvProductionKWh),
      gridSupplyKWh: round2(b.gridSupplyKWh),
      chargeKWh: round2(b.chargeKWh),
      dischargeKWh: round2(b.dischargeKWh),
      loadKWh: round2(b.loadKWh),
    }));
  }

  async tariffSeries(plantId: PlantId, date: string): Promise<TariffPoint[]> {
    await delay(SIMULATED_LATENCY_MS);
    const ctx = this.context(plantId);
    if (!ctx) return [];
    const start = localMidnightUtc(date, ctx.fixture.location.timezone);
    return Array.from({ length: 25 }, (_, hour) => ({
      at: new Date(start.getTime() + hour * 3_600_000).toISOString(),
      purchaseIDRPerKWh: hour >= 17 && hour < 22 ? round2(ctx.lifetime.purchaseTariffIDRPerKWh * PURCHASE_WBP_FACTOR) : ctx.lifetime.purchaseTariffIDRPerKWh,
      feedInIDRPerKWh: ctx.lifetime.tariffIDRPerKWh,
    }));
  }

  private context(plantId: PlantId) {
    const lifetime = this.items.find((p) => p.plantId === plantId);
    const fixture = this.fixtures.get(plantId);
    if (!lifetime || !fixture) return null;
    const today = toDateKey(this.now(), fixture.location.timezone);
    return {
      fixture,
      lifetime,
      today,
      lifetimeDays: Math.max(1, daysBetween(fixture.commissionedAt, today)),
      offlineToday: derivePlantStatus(fixture.devices) === "OFFLINE",
    };
  }
}

// Tanggal-tanggal dalam periode, dipotong ke [commissioning, hari ini].
function datesIn(query: OperatingDataQuery, commissionedAt: string, today: string, wholeLifetime = false): string[] {
  let from: string;
  let to: string;
  if (wholeLifetime) {
    from = commissionedAt;
    to = today;
  } else if (query.granularity === "day") {
    from = query.date;
    to = query.date;
  } else if (query.granularity === "month") {
    from = query.date.slice(0, 7) + "-01";
    to = addDays(nextMonthStart(from), -1);
  } else {
    from = query.date.slice(0, 4) + "-01-01";
    to = query.date.slice(0, 4) + "-12-31";
  }
  if (from < commissionedAt) from = commissionedAt;
  if (to > today) to = today;

  const out: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
}

function nextMonthStart(monthStart: string): string {
  const [y, m] = monthStart.split("-").map(Number);
  return m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
