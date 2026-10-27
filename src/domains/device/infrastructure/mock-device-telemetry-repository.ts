import type { PerformanceRepository } from "@/domains/performance/application/performance-repository";
import type { EnergySeriesGranularity } from "@/domains/performance/domain/performance";
import type { PlantId } from "@/domains/plant/domain/plant";
import { plantFixtures, type PlantFixture } from "@/domains/plant/infrastructure/fixtures";
import type { TelemetryRepository } from "@/domains/telemetry/application/telemetry-repository";
import type { PowerSample } from "@/domains/telemetry/domain/power-snapshot";
import { hashSeed, toDateKey } from "@/shared/domain/time";
import type { DeviceTelemetryRepository } from "../application/device-repository";
import type { DeviceRecord } from "../domain/device";
import type { BatteryReading, DeviceEnergyBucket, DeviceReading, DeviceSample, InverterReading, MeterReading, PcsReading, PhaseReading } from "../domain/reading";
import { buildDeviceRecords } from "./mock-device-repository";

const SAMPLE_HOURS = 5 / 60;

// Mock telemetri perangkat: menurunkan angka per perangkat dari data plant
// (snapshot daya, deret 5 menit, operating data) supaya konsisten dengan Overview.
export class MockDeviceTelemetryRepository implements DeviceTelemetryRepository {
  private readonly devices = new Map<string, { record: DeviceRecord; fixture: PlantFixture }>();
  private readonly byPlant = new Map<PlantId, DeviceRecord[]>();

  constructor(
    private readonly telemetry: TelemetryRepository,
    private readonly performance: PerformanceRepository,
    fixtures: PlantFixture[] = plantFixtures,
    private readonly now: () => Date = () => new Date(),
  ) {
    for (const fixture of fixtures) {
      const records = buildDeviceRecords(fixture);
      this.byPlant.set(fixture.id, records);
      for (const record of records) this.devices.set(record.id, { record, fixture });
    }
  }

  async latestForPlant(plantId: PlantId): Promise<Record<string, DeviceReading>> {
    const records = this.byPlant.get(plantId) ?? [];
    const out: Record<string, DeviceReading> = {};
    const ctx = await this.plantContext(plantId);
    if (!ctx) return out;
    for (const record of records) out[record.id] = this.readingFor(record, ctx);
    return out;
  }

  async latest(deviceId: string): Promise<DeviceReading | null> {
    const entry = this.devices.get(deviceId);
    if (!entry) return null;
    const ctx = await this.plantContext(entry.record.plantId);
    return ctx ? this.readingFor(entry.record, ctx) : null;
  }

  async dailySeries(deviceId: string, date: string): Promise<DeviceSample[]> {
    const entry = this.devices.get(deviceId);
    if (!entry) return [];
    const samples = await this.telemetry.dailySeries(entry.record.plantId, date);
    const online = this.onlineInverters(entry.record.plantId);
    const units = this.batteryUnits(entry.record.plantId);
    const pcs = this.pcsUnits(entry.record.plantId);
    return samples.map((s) => ({ at: s.at, values: sampleValues(entry.record, s, online, units, pcs) }));
  }

  async energySeries(deviceId: string, granularity: EnergySeriesGranularity, date: string): Promise<DeviceEnergyBucket[]> {
    const entry = this.devices.get(deviceId);
    if (!entry) return [];
    const buckets = await this.performance.energySeries(entry.record.plantId, granularity, date);
    const inverterCount = Math.max(1, (this.byPlant.get(entry.record.plantId) ?? []).filter((d) => d.kind === "INVERTER").length);
    return buckets.map((b) => {
      const values: Record<string, number> = {};
      if (entry.record.kind === "INVERTER") values.dailyYieldKWh = round(b.pvProductionKWh / inverterCount, 0);
      if (entry.record.kind === "BATTERY") {
        const units = this.batteryUnits(entry.record.plantId);
        values.dailyChargeKWh = round(b.chargeKWh / units, 0);
        values.dailyDischargeKWh = round(b.dischargeKWh / units, 0);
      }
      if (entry.record.kind === "PCS") {
        const pcs = this.pcsUnits(entry.record.plantId);
        values.dailyChargeKWh = round(b.chargeKWh / pcs, 0);
        values.dailyDischargeKWh = round(b.dischargeKWh / pcs, 0);
      }
      if (entry.record.kind === "METER") {
        values.dailyImportKWh = round(b.gridSupplyKWh, 0);
        values.dailyExportKWh = 0; // mock plant tidak mengekspor
      }
      return { key: b.key, values };
    });
  }

  private onlineInverters(plantId: PlantId): number {
    return Math.max(1, (this.byPlant.get(plantId) ?? []).filter((d) => d.kind === "INVERTER" && d.connected).length);
  }

  private batteryUnits(plantId: PlantId): number {
    return Math.max(1, (this.byPlant.get(plantId) ?? []).filter((d) => d.kind === "BATTERY").length);
  }

  private pcsUnits(plantId: PlantId): number {
    return Math.max(1, (this.byPlant.get(plantId) ?? []).filter((d) => d.kind === "PCS").length);
  }

  private async plantContext(plantId: PlantId) {
    const fixture = [...this.devices.values()].find((e) => e.fixture.id === plantId)?.fixture;
    if (!fixture) return null;
    const today = toDateKey(this.now(), fixture.location.timezone);
    const [snapshot, day, month, year, lifetime, series] = await Promise.all([
      this.telemetry.latest(plantId),
      this.performance.operatingData({ plantId, granularity: "day", date: today }),
      this.performance.operatingData({ plantId, granularity: "month", date: today }),
      this.performance.operatingData({ plantId, granularity: "year", date: today }),
      this.performance.findAll().then((all) => all.find((p) => p.plantId === plantId)),
      this.telemetry.dailySeries(plantId, today),
    ]);
    if (!snapshot) return null;
    const inverterCount = Math.max(1, (this.byPlant.get(plantId) ?? []).filter((d) => d.kind === "INVERTER").length);
    return { fixture, snapshot, day, month, year, lifetime, series, inverterCount, online: this.onlineInverters(plantId), units: this.batteryUnits(plantId), pcs: this.pcsUnits(plantId) };
  }

  private readingFor(record: DeviceRecord, ctx: NonNullable<Awaited<ReturnType<MockDeviceTelemetryRepository["plantContext"]>>>): DeviceReading {
    const { snapshot, day, month, year, lifetime, series, inverterCount, online, units, pcs } = ctx;
    const values = sampleValues(record, snapshot, online, units, pcs);
    const at = snapshot.at;

    if (record.kind === "INVERTER") {
      const powerKW = values.powerKW;
      const dailyYieldKWh = record.connected ? round(day.pvProductionKWh / inverterCount, 1) : 0;
      const reading: InverterReading = {
        kind: "INVERTER",
        deviceId: record.id,
        at,
        powerKW,
        dailyYieldKWh,
        totalYieldKWh: round((lifetime?.generationKWh ?? 0) / inverterCount, 0),
        dailyFullLoadHours: record.ratedPowerKW > 0 ? round(dailyYieldKWh / record.ratedPowerKW, 2) : 0,
        internalTempC: values.internalTempC,
        strings: Array.from({ length: record.stringCount }, (_, i) => {
          const v = values.dcVoltageV * (1 + ((hashSeed(`${record.id}:pv${i}`) % 40) - 20) / 1000);
          const p = (powerKW * 1000) / record.stringCount;
          return { name: `PV${i + 1}`, voltageV: round(v, 1), currentA: v > 0 ? round(p / v, 1) : 0, powerW: round(p, 0) };
        }),
        phases: phases(record.id, values.acVoltageL1V, values.acVoltageL2V, values.acVoltageL3V, values.acCurrentL1A, values.frequencyHz),
      };
      return reading;
    }

    if (record.kind === "BATTERY") {
      const reading: BatteryReading = {
        kind: "BATTERY",
        deviceId: record.id,
        at,
        socPercent: values.socPercent,
        operatingStatus: values.powerKW > 0.05 ? "CHARGING" : values.powerKW < -0.05 ? "DISCHARGING" : "IDLE",
        voltageV: values.voltageV,
        currentA: values.currentA,
        powerKW: values.powerKW,
        // Angka per unit: energi plant dibagi rata ke semua unit baterai.
        dailyChargeKWh: round(day.bessChargeKWh / units, 0),
        dailyDischargeKWh: round(day.bessDischargeKWh / units, 0),
        monthChargeKWh: round(month.bessChargeKWh / units, 0),
        monthDischargeKWh: round(month.bessDischargeKWh / units, 0),
        yearChargeKWh: round(year.bessChargeKWh / units, 0),
        yearDischargeKWh: round(year.bessDischargeKWh / units, 0),
        minCellVoltageV: round(values.voltageV / record.modulesInSeries / 16 - 0.02, 3),
        maxCellVoltageV: round(values.voltageV / record.modulesInSeries / 16 + 0.02, 3),
        minCellTempC: round(27 + (hashSeed(record.id) % 30) / 10, 1),
        maxCellTempC: round(31 + (hashSeed(record.id + ":t") % 40) / 10, 1),
        cycleCount: Math.max(0, Math.floor((this.now().getTime() - new Date(record.commissionedAt).getTime()) / 86_400_000)),
      };
      return reading;
    }

    if (record.kind === "PCS") {
      // Energi charge/discharge plant dibagi rata ke semua PCS; total = akumulasi sejak commissioning (mock).
      const ratio = (lifetime?.chargeKWh ?? 0) / Math.max(1, pcs);
      const reading: PcsReading = {
        kind: "PCS",
        deviceId: record.id,
        at,
        operatingStatus: values.powerKW > 0.05 ? "CHARGING" : values.powerKW < -0.05 ? "DISCHARGING" : "IDLE",
        powerKW: values.powerKW,
        dcVoltageV: values.dcVoltageV,
        dcCurrentA: values.dcCurrentA,
        internalTempC: values.internalTempC,
        efficiencyPercent: values.powerKW !== 0 ? round(96.5 + (hashSeed(record.id) % 15) / 10, 1) : 0,
        phases: phases(record.id, values.acVoltageL1V, values.acVoltageL2V, values.acVoltageL3V, values.acCurrentL1A, values.frequencyHz),
        dailyChargeKWh: round(day.bessChargeKWh / pcs, 0),
        dailyDischargeKWh: round(day.bessDischargeKWh / pcs, 0),
        totalChargeKWh: round(ratio, 0),
        totalDischargeKWh: round((lifetime?.dischargeKWh ?? 0) / Math.max(1, pcs), 0),
      };
      return reading;
    }

    // Meter: impor/ekspor harian dari deret daya grid hari ini (+ impor, − ekspor).
    let importKWh = 0;
    let exportKWh = 0;
    for (const s of series) {
      if (s.gridKW > 0) importKWh += s.gridKW * SAMPLE_HOURS;
      else exportKWh += -s.gridKW * SAMPLE_HOURS;
    }
    const reading: MeterReading = {
      kind: "METER",
      deviceId: record.id,
      at,
      activePowerKW: values.activePowerKW,
      dailyImportKWh: round(importKWh, 1),
      dailyExportKWh: round(exportKWh, 1),
      phases: phases(record.id, values.voltageV, values.voltageV, values.voltageV, values.currentA, values.frequencyHz),
      powerFactor: values.powerFactor,
    };
    return reading;
  }
}

// Nilai parameter chart satu sampel, diturunkan dari sampel daya plant.
function sampleValues(record: DeviceRecord, s: PowerSample, onlineInverters: number, batteryUnits: number, pcsUnits: number): Record<string, number> {
  const seed = hashSeed(`${record.id}:${s.at}`);
  const j = (amp: number, k = 0) => 1 + (((seed >>> k) % 1000) / 1000 - 0.5) * 2 * amp;

  if (record.kind === "INVERTER") {
    const powerKW = record.connected ? round(s.pvKW / onlineInverters, 1) : 0;
    const producing = powerKW > 0.05;
    const dcVoltageV = round(producing ? 640 * j(0.03) : 45 * j(0.1, 3), 1);
    const acVoltage = (k: number) => round(230 * j(0.01, k), 1);
    const acCurrent = round(producing ? (powerKW * 1000) / (3 * 230) : 0, 1);
    return {
      powerKW,
      dcVoltageV,
      dcCurrentA: round(producing ? (powerKW * 1000) / dcVoltageV : 0, 1),
      acVoltageL1V: acVoltage(2),
      acVoltageL2V: acVoltage(4),
      acVoltageL3V: acVoltage(6),
      acCurrentL1A: acCurrent,
      acCurrentL2A: round(acCurrent * j(0.02, 8), 1),
      acCurrentL3A: round(acCurrent * j(0.02, 10), 1),
      frequencyHz: round(50 * j(0.0006, 12), 2),
      internalTempC: round(35 + (record.ratedPowerKW > 0 ? (powerKW / record.ratedPowerKW) * 12 : 0) + j(0.02, 14) - 1, 1),
    };
  }

  if (record.kind === "BATTERY") {
    // Daya plant dibagi rata per unit; SOC tiap unit bergeser kecil (±2) supaya tidak identik.
    const powerKW = record.connected ? round(s.batteryKW / batteryUnits, 1) : 0;
    const socPercent = Math.max(0, Math.min(100, s.socPercent + ((hashSeed(record.id) % 5) - 2)));
    const voltageV = round(580 + socPercent * 0.6, 1);
    return {
      socPercent,
      powerKW,
      voltageV,
      currentA: round((powerKW * 1000) / voltageV, 1),
    };
  }

  if (record.kind === "PCS") {
    // Daya baterai plant dibagi rata per PCS (+ charge, − discharge); bus DC mengikuti SOC.
    const powerKW = record.connected ? round(s.batteryKW / pcsUnits, 1) : 0;
    const active = Math.abs(powerKW) > 0.05;
    const dcVoltageV = round((640 + s.socPercent * 1.2) * j(0.01), 1);
    const acVoltage = (k: number) => round(230 * j(0.01, k), 1);
    const acCurrent = round(active ? (Math.abs(powerKW) * 1000) / (3 * 230) : 0, 1);
    return {
      powerKW,
      dcVoltageV,
      dcCurrentA: round(active ? (Math.abs(powerKW) * 1000) / dcVoltageV : 0, 1),
      acVoltageL1V: acVoltage(2),
      acVoltageL2V: acVoltage(4),
      acVoltageL3V: acVoltage(6),
      acCurrentL1A: acCurrent,
      acCurrentL2A: round(acCurrent * j(0.02, 8), 1),
      acCurrentL3A: round(acCurrent * j(0.02, 10), 1),
      frequencyHz: round(50 * j(0.0006, 12), 2),
      internalTempC: round(32 + (record.ratedPowerKW > 0 ? (Math.abs(powerKW) / record.ratedPowerKW) * 10 : 0) + j(0.02, 14) - 1, 1),
    };
  }

  const activePowerKW = record.connected ? s.gridKW : 0;
  return {
    activePowerKW,
    voltageV: round(230 * j(0.01, 2), 1),
    currentA: round((Math.abs(activePowerKW) * 1000) / (3 * 230), 1),
    frequencyHz: round(50 * j(0.0006, 12), 2),
    powerFactor: round(0.95 * j(0.03, 6), 2),
  };
}

function phases(id: string, v1: number, v2: number, v3: number, current: number, frequencyHz: number): PhaseReading[] {
  return [
    { name: "L1", voltageV: v1, currentA: current, frequencyHz },
    { name: "L2", voltageV: v2, currentA: round(current * (1 + ((hashSeed(id + "L2") % 40) - 20) / 1000), 1), frequencyHz },
    { name: "L3", voltageV: v3, currentA: round(current * (1 + ((hashSeed(id + "L3") % 40) - 20) / 1000), 1), frequencyHz },
  ];
}

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}
