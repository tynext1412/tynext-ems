import type { PerformanceRepository } from "@/domains/performance/application/performance-repository";
import { sumEnergyBuckets, type EnergyBucket, type EnergySeriesGranularity } from "@/domains/performance/domain/performance";
import type { MeterType, PlantId } from "@/domains/plant/domain/plant";
import { inverterAvailability } from "@/domains/plant/domain/status-policy";
import { plantFixtures, type PlantFixture } from "@/domains/plant/infrastructure/fixtures";
import type { TelemetryRepository } from "@/domains/telemetry/application/telemetry-repository";
import type { PowerSample } from "@/domains/telemetry/domain/power-snapshot";
import { irradiance } from "@/domains/telemetry/infrastructure/mock-telemetry-repository";
import { hashSeed, localHour, toDateKey } from "@/shared/domain/time";
import type { DeviceTelemetryRepository } from "../application/device-repository";
import type { DeviceRecord } from "../domain/device";
import type { BatteryReading, DeviceEnergyBucket, DeviceReading, DeviceSample, EmiReading, EssWorkingMode, InverterReading, MeterReading, PcsReading, PhaseReading } from "../domain/reading";
import { buildDeviceRecords } from "./mock-device-repository";

const SAMPLE_HOURS = 5 / 60;
const INVERTER_EFFICIENCY = 0.975; // energi AC keluar / energi DC masuk (mock)
const AUX_LOAD_SHARE = 0.04; // power sensor mengukur beban bantu ≈ 4 % beban plant (mock)
const REACTIVE_ENERGY_RATIO = 0.2; // energi reaktif ≈ 20 % energi aktif (PF ≈ 0,98)
const PERFORMANCE_RATIO = 0.8; // daya PV = kWp × 0,8 × iradiasi relatif (sama dengan mock telemetri)
const CELLS_PER_RACK = 256; // sel LFP seri per rak (≈ 830 V)
const ESS_MODES: readonly EssWorkingMode[] = ["TIME_OF_USE", "PEAK_SHAVING", "SELF_CONSUMPTION"];

interface SampleContext {
  fixture: PlantFixture;
  onlineInverters: number;
  batteryUnits: number;
  pcsUnits: number;
}

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
    const ctx = this.sampleContext(entry.record.plantId, entry.fixture);
    return samples.map((s) => ({ at: s.at, values: sampleValues(entry.record, s, ctx) }));
  }

  async energySeries(deviceId: string, granularity: EnergySeriesGranularity, date: string): Promise<DeviceEnergyBucket[]> {
    const entry = this.devices.get(deviceId);
    if (!entry) return [];
    const buckets = await this.performance.energySeries(entry.record.plantId, granularity, date);
    const inverterCount = Math.max(1, (this.byPlant.get(entry.record.plantId) ?? []).filter((d) => d.kind === "INVERTER").length);
    const record = entry.record;
    const emiFactor = this.emiFactor(entry.fixture);
    return buckets.map((b) => {
      const values: Record<string, number> = {};
      if (record.kind === "INVERTER") values.yieldTodayKWh = round(b.pvProductionKWh / inverterCount, 0);
      if (record.kind === "BATTERY") {
        const units = this.batteryUnits(record.plantId);
        values.chargeEnergyKWh = round(b.chargeKWh / units, 0);
        values.dischargeEnergyKWh = round(b.dischargeKWh / units, 0);
      }
      if (record.kind === "PCS") {
        const pcs = this.pcsUnits(record.plantId);
        values.dailyChargeKWh = round(b.chargeKWh / pcs, 0);
        values.dailyDischargeKWh = round(b.dischargeKWh / pcs, 0);
      }
      if (record.kind === "METER") {
        const e = meterEnergy(record.meterType, b);
        values.forwardActiveEnergyKWh = round(e.forward, 0);
        values.reverseActiveEnergyKWh = round(e.reverse, 0);
        values.forwardReactiveEnergyKvarh = round(e.forward * REACTIVE_ENERGY_RATIO, 0);
        values.reverseReactiveEnergyKvarh = round(e.reverse * REACTIVE_ENERGY_RATIO, 0);
      }
      if (record.kind === "EMI") {
        // Iradiasi harian (kWh/m²) = energi PV / (kWp × PR × ketersediaan inverter); horizontal ≈ 93 % POA.
        values.dailyIrradiationPoaKWhM2 = round(b.pvProductionKWh * emiFactor, 2);
        values.dailyHorizontalIrradiationKWhM2 = round(b.pvProductionKWh * emiFactor * 0.93, 2);
      }
      return { key: b.key, values };
    });
  }

  private sampleContext(plantId: PlantId, fixture: PlantFixture): SampleContext {
    return { fixture, onlineInverters: this.onlineInverters(plantId), batteryUnits: this.batteryUnits(plantId), pcsUnits: this.pcsUnits(plantId) };
  }

  private emiFactor(fixture: PlantFixture): number {
    const inv = inverterAvailability(fixture.devices);
    const availability = inv.total > 0 ? Math.max(inv.online / inv.total, 0.01) : 1;
    return fixture.capacity.pvKWp > 0 ? 1 / (fixture.capacity.pvKWp * PERFORMANCE_RATIO * availability) : 0;
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
    const [snapshot, day, month, year, lifetime, series, lifetimeBuckets] = await Promise.all([
      this.telemetry.latest(plantId),
      this.performance.operatingData({ plantId, granularity: "day", date: today }),
      this.performance.operatingData({ plantId, granularity: "month", date: today }),
      this.performance.operatingData({ plantId, granularity: "year", date: today }),
      this.performance.findAll().then((all) => all.find((p) => p.plantId === plantId)),
      this.telemetry.dailySeries(plantId, today),
      this.performance.energySeries(plantId, "lifetime", today),
    ]);
    if (!snapshot) return null;
    const inverterCount = Math.max(1, (this.byPlant.get(plantId) ?? []).filter((d) => d.kind === "INVERTER").length);
    return { fixture, snapshot, day, month, year, lifetime, series, lifetimeTotals: sumEnergyBuckets(lifetimeBuckets), inverterCount, sample: this.sampleContext(plantId, fixture), units: this.batteryUnits(plantId), pcs: this.pcsUnits(plantId) };
  }

  private readingFor(record: DeviceRecord, ctx: NonNullable<Awaited<ReturnType<MockDeviceTelemetryRepository["plantContext"]>>>): DeviceReading {
    const { snapshot, day, month, year, lifetime, series, lifetimeTotals, inverterCount, sample, units, pcs } = ctx;
    const values = sampleValues(record, snapshot, sample);
    const at = snapshot.at;

    if (record.kind === "INVERTER") {
      const yieldTodayKWh = record.connected ? round(day.pvProductionKWh / inverterCount, 1) : 0;
      const totalYieldKWh = round((lifetime?.generationKWh ?? 0) / inverterCount, 0);
      const producing = values.activePowerKW > 0.05;
      const reading: InverterReading = {
        kind: "INVERTER",
        deviceId: record.id,
        at,
        // 512 = On-grid, 40960 = Standby: no irradiation, 771 = Communication disconnected (lihat inverter-status.ts).
        statusCode: !record.connected ? 771 : producing ? 512 : 40960,
        runState: record.connected ? "CONNECTED" : "DISCONNECTED",
        gridConnection: "ON_GRID",
        lineVoltageV: { ab: values.lineVoltageABV, bc: values.lineVoltageBCV, ca: values.lineVoltageCAV },
        phases: [
          { name: "A", voltageV: values.phaseAVoltageV, currentA: values.phaseACurrentA },
          { name: "B", voltageV: values.phaseBVoltageV, currentA: values.phaseBCurrentA },
          { name: "C", voltageV: values.phaseCVoltageV, currentA: values.phaseCCurrentA },
        ],
        powerFactor: values.powerFactor,
        gridFrequencyHz: values.gridFrequencyHz,
        activePowerKW: values.activePowerKW,
        reactivePowerKvar: values.reactivePowerKvar,
        apparentPowerKVA: values.apparentPowerKVA,
        yieldTodayKWh,
        totalYieldKWh,
        totalDcInputKWh: round(totalYieldKWh / INVERTER_EFFICIENCY, 0),
        ratedPowerKW: record.ratedPowerKW,
      };
      return reading;
    }

    if (record.kind === "BATTERY") {
      const power = values.chargeDischargePowerKW;
      const rackVoltage = (values.minCellVoltageV + values.maxCellVoltageV) / 2 * CELLS_PER_RACK;
      const reading: BatteryReading = {
        kind: "BATTERY",
        deviceId: record.id,
        at,
        operatingStatus: power > 0.05 ? "CHARGING" : power < -0.05 ? "DISCHARGING" : "IDLE",
        chargeDischargePowerKW: power,
        socPercent: values.socPercent,
        sohPercent: values.sohPercent,
        workingMode: ESS_MODES[hashSeed(record.plantId) % ESS_MODES.length],
        runState: record.connected ? "CONNECTED" : "DISCONNECTED",
        // Angka per unit: energi plant dibagi rata ke semua unit baterai.
        chargeEnergyTodayKWh: round(day.bessChargeKWh / units, 0),
        dischargeEnergyTodayKWh: round(day.bessDischargeKWh / units, 0),
        chargeEnergyMonthKWh: round(month.bessChargeKWh / units, 0),
        dischargeEnergyMonthKWh: round(month.bessDischargeKWh / units, 0),
        chargeEnergyYearKWh: round(year.bessChargeKWh / units, 0),
        dischargeEnergyYearKWh: round(year.bessDischargeKWh / units, 0),
        racks: Array.from({ length: record.rackCount }, (_, r) => {
          const skew = ((hashSeed(`${record.id}:rack${r}`) % 21) - 10) / 10; // ±1
          const voltageV = round(rackVoltage * (1 + skew / 400), 1);
          return {
            name: `Rack ${r + 1}`,
            socPercent: record.connected ? Math.max(0, Math.min(100, Math.round(values.socPercent + skew))) : 0,
            voltageV: record.connected ? voltageV : 0,
            currentA: record.connected && voltageV > 0 ? round((power * 1000) / voltageV / record.rackCount, 1) : 0,
          };
        }),
        maxCellVoltageV: values.maxCellVoltageV,
        minCellVoltageV: values.minCellVoltageV,
        maxCellTempC: values.maxCellTempC,
        minCellTempC: values.minCellTempC,
        pcsActivePowerKW: values.pcsActivePowerKW,
        pcsReactivePowerKvar: values.pcsReactivePowerKvar,
        chargeableEnergyKWh: values.chargeableEnergyKWh,
        dischargeableEnergyKWh: values.dischargeableEnergyKWh,
        ratedCapacityKWh: record.capacityKWh,
        hvacStatus: !record.connected ? "STANDBY" : Math.abs(power) > 0.05 || values.maxCellTempC > 30 ? "COOLING" : "STANDBY",
        fireSuppressionStatus: "NORMAL",
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

    if (record.kind === "METER") {
      // Energi hari ini dari deret daya meter (bagian + = forward, − = reverse); kumulatif dari energi lifetime plant.
      let forwardToday = 0;
      let reverseToday = 0;
      for (const sample of series) {
        const kw = record.connected ? meterPowerKW(record.meterType, sample) : 0;
        if (kw > 0) forwardToday += kw * SAMPLE_HOURS;
        else reverseToday += -kw * SAMPLE_HOURS;
      }
      const total = meterEnergy(record.meterType, lifetimeTotals);
      const sensor = record.meterType === "POWER_SENSOR";
      const reading: MeterReading = {
        kind: "METER",
        deviceId: record.id,
        at,
        runState: record.connected ? "CONNECTED" : "DISCONNECTED",
        meterStatus: sensor ? (record.connected ? "NORMAL" : "OFFLINE") : undefined,
        activePowerKW: values.activePowerKW,
        reactivePowerKvar: values.reactivePowerKvar,
        apparentPowerKVA: sensor ? undefined : values.apparentPowerKVA,
        powerFactor: values.powerFactor,
        gridFrequencyHz: values.gridFrequencyHz,
        lineVoltageV: { ab: values.lineVoltageABV, bc: values.lineVoltageBCV, ca: values.lineVoltageCAV },
        phases: (["A", "B", "C"] as const).map((ph) => ({
          name: ph,
          voltageV: values[`phase${ph}VoltageV`],
          currentA: values[`phase${ph}CurrentA`],
          activePowerKW: values[`activePower${ph}KW`],
          reactivePowerKvar: sensor ? undefined : values[`reactivePower${ph}Kvar`],
        })),
        forwardActiveEnergyKWh: round(total.forward, 0),
        reverseActiveEnergyKWh: round(total.reverse, 0),
        forwardReactiveEnergyKvarh: round(total.forward * REACTIVE_ENERGY_RATIO, 0),
        reverseReactiveEnergyKvarh: round(total.reverse * REACTIVE_ENERGY_RATIO, 0),
        forwardActiveEnergyTodayKWh: round(forwardToday, 1),
        reverseActiveEnergyTodayKWh: round(reverseToday, 1),
      };
      return reading;
    }

    // EMI: iradiasi harian hari ini = jumlah iradiansi POA tiap 5 menit sampai sekarang.
    let poaToday = 0;
    for (const sample of series) poaToday += sampleValues(record, sample, ctx.sample).irradiancePoaWm2 * SAMPLE_HOURS;
    const reading: EmiReading = {
      kind: "EMI",
      deviceId: record.id,
      at,
      runState: record.connected ? "CONNECTED" : "DISCONNECTED",
      ambientTempC: values.ambientTempC,
      moduleTempC: values.moduleTempC,
      windSpeedMs: values.windSpeedMs,
      windDirectionDeg: values.windDirectionDeg,
      irradiancePoaWm2: values.irradiancePoaWm2,
      horizontalIrradianceWm2: values.horizontalIrradianceWm2,
      dailyIrradiationPoaKWhM2: record.connected ? round(poaToday / 1000, 2) : 0,
      dailyHorizontalIrradiationKWhM2: record.connected ? round((poaToday / 1000) * 0.93, 2) : 0,
    };
    return reading;
  }
}

// Daya yang dilihat meter menurut titik ukurnya. Tanda mengikuti konvensi plant: STG + impor;
// ESS + charge; PV, beban, genset, dan power sensor (beban bantu) selalu positif.
function meterPowerKW(meterType: MeterType, s: PowerSample): number {
  switch (meterType) {
    case "STG":
      return s.gridKW;
    case "PV":
      return s.pvKW;
    case "LOAD":
      return s.loadKW;
    case "ESS":
      return s.batteryKW;
    case "DEG":
      return s.gensetKW;
    case "POWER_SENSOR":
      return s.loadKW * AUX_LOAD_SHARE;
  }
}

// Energi forward/reverse meter dari energi plant per periode.
function meterEnergy(meterType: MeterType, b: Omit<EnergyBucket, "key">): { forward: number; reverse: number } {
  switch (meterType) {
    case "STG":
      return { forward: b.gridSupplyKWh, reverse: b.gridExportKWh };
    case "PV":
      return { forward: b.pvProductionKWh, reverse: 0 };
    case "LOAD":
      return { forward: b.loadKWh, reverse: 0 };
    case "ESS":
      return { forward: b.chargeKWh, reverse: b.dischargeKWh };
    case "DEG":
      return { forward: b.generatorSupplyKWh, reverse: 0 };
    case "POWER_SENSOR":
      return { forward: b.loadKWh * AUX_LOAD_SHARE, reverse: 0 };
  }
}

// Nilai parameter chart satu sampel, diturunkan dari sampel daya plant.
function sampleValues(record: DeviceRecord, s: PowerSample, ctx: SampleContext): Record<string, number> {
  const { onlineInverters, batteryUnits, pcsUnits, fixture } = ctx;
  const seed = hashSeed(`${record.id}:${s.at}`);
  const j = (amp: number, k = 0) => 1 + (((seed >>> k) % 1000) / 1000 - 0.5) * 2 * amp;

  if (record.kind === "INVERTER") {
    // Sisi AC jaringan 230/400 V: tegangan line = fasa × √3. Faktor daya ~0,99 saat berproduksi.
    const activePowerKW = record.connected ? round(s.pvKW / onlineInverters, 1) : 0;
    const producing = activePowerKW > 0.05;
    const powerFactor = producing ? round(0.99 * j(0.006, 16), 3) : 0;
    const apparentPowerKVA = producing ? round(activePowerKW / powerFactor, 1) : 0;
    const phaseVoltage = (k: number) => (record.connected ? round(230 * j(0.01, k), 1) : 0);
    const [va, vb, vc] = [phaseVoltage(2), phaseVoltage(4), phaseVoltage(6)];
    const current = producing ? (apparentPowerKVA * 1000) / (3 * 230) : 0;
    return {
      activePowerKW,
      reactivePowerKvar: producing ? round(Math.sqrt(Math.max(0, apparentPowerKVA ** 2 - activePowerKW ** 2)), 1) : 0,
      apparentPowerKVA,
      powerFactor,
      lineVoltageABV: round(((va + vb) / 2) * Math.sqrt(3), 1),
      lineVoltageBCV: round(((vb + vc) / 2) * Math.sqrt(3), 1),
      lineVoltageCAV: round(((vc + va) / 2) * Math.sqrt(3), 1),
      phaseAVoltageV: va,
      phaseBVoltageV: vb,
      phaseCVoltageV: vc,
      phaseACurrentA: round(current, 1),
      phaseBCurrentA: round(current * j(0.02, 8), 1),
      phaseCCurrentA: round(current * j(0.02, 10), 1),
      gridFrequencyHz: record.connected ? round(50 * j(0.0006, 12), 2) : 0,
    };
  }

  if (record.kind === "BATTERY") {
    // C&I ESS: daya plant dibagi rata per unit (+ charge, − discharge); SOC tiap unit bergeser ±2.
    const power = record.connected ? round(s.batteryKW / batteryUnits, 1) : 0;
    const soc = record.connected ? Math.max(0, Math.min(100, s.socPercent + ((hashSeed(record.id) % 5) - 2))) : 0;
    const ageYears = Math.max(0, (new Date(s.at).getTime() - new Date(record.commissionedAt).getTime()) / (365.25 * 86_400_000));
    const soh = round(100 - ageYears * 1.8 - (hashSeed(record.id + ":soh") % 15) / 10, 1);
    const cell = 3.2 + (soc / 100) * 0.15; // LFP: 3,20–3,35 V per sel
    const load = record.capacityKWh > 0 ? Math.abs(power) / (record.capacityKWh * 0.5) : 0;
    const minTemp = 24.5 + load * 4 + (hashSeed(record.id + ":t") % 20) / 10;
    const usable = (record.capacityKWh * soh) / 100;
    return {
      chargeDischargePowerKW: power,
      socPercent: soc,
      sohPercent: soh,
      maxCellVoltageV: record.connected ? round(cell + 0.012 * j(0.2, 3), 3) : 0,
      minCellVoltageV: record.connected ? round(cell - 0.012 * j(0.2, 5), 3) : 0,
      minCellTempC: round(minTemp, 1),
      maxCellTempC: round(minTemp + 2.5 * j(0.2, 7), 1),
      // Sisi AC PCS: rugi konversi ±2,5 %; daya reaktif kecil untuk dukungan tegangan.
      pcsActivePowerKW: round(power > 0 ? power / 0.975 : power * 0.975, 1),
      pcsReactivePowerKvar: round(Math.abs(power) * 0.05 * j(0.3, 9), 1),
      chargeableEnergyKWh: round((usable * (100 - soc)) / 100, 0),
      dischargeableEnergyKWh: round((usable * soc) / 100, 0),
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

  if (record.kind === "METER") {
    // Grid Meter / Power Sensor 3 fasa 230/400 V: daya dibagi ke fasa dengan sedikit ketidakseimbangan.
    const p = record.connected ? round(meterPowerKW(record.meterType, s), 1) : 0;
    const flowing = Math.abs(p) > 0.05;
    const pf = flowing ? round(0.97 * j(0.015, 16), 3) : 0;
    const q = flowing ? Math.abs(p) * Math.tan(Math.acos(Math.min(pf, 0.9999))) : 0;
    const weights = [j(0.03, 18), j(0.03, 20), j(0.03, 22)];
    const sum = weights[0] + weights[1] + weights[2];
    const v = [0, 1, 2].map((k) => (record.connected ? round(230 * j(0.01, 2 + 2 * k), 1) : 0));
    const out: Record<string, number> = {
      activePowerKW: p,
      reactivePowerKvar: round(q, 1),
      apparentPowerKVA: round(Math.sqrt(p * p + q * q), 1),
      powerFactor: pf,
      gridFrequencyHz: record.connected ? round(50 * j(0.0006, 12), 2) : 0,
      lineVoltageABV: round(((v[0] + v[1]) / 2) * Math.sqrt(3), 1),
      lineVoltageBCV: round(((v[1] + v[2]) / 2) * Math.sqrt(3), 1),
      lineVoltageCAV: round(((v[2] + v[0]) / 2) * Math.sqrt(3), 1),
    };
    (["A", "B", "C"] as const).forEach((ph, k) => {
      const share = weights[k] / sum;
      const pPhase = p * share;
      const qPhase = q * share;
      out[`phase${ph}VoltageV`] = v[k];
      out[`activePower${ph}KW`] = round(pPhase, 1);
      out[`reactivePower${ph}Kvar`] = round(qPhase, 1);
      out[`phase${ph}CurrentA`] = v[k] > 0 ? round((Math.sqrt(pPhase * pPhase + qPhase * qPhase) * 1000) / v[k], 1) : 0;
    });
    return out;
  }

  // EMI / weather station: iradiansi dari kurva yang sama dengan daya PV; suhu dari cuaca plant.
  const hour = localHour(new Date(s.at), fixture.location.timezone);
  const sun = irradiance(hour);
  const poa = record.connected ? round(1000 * sun * j(0.04, 2), 0) : 0;
  const ambient = (fixture.weather?.temperatureC ?? 30) - 3 + 6 * sun + (j(0.05, 4) - 1) * 4;
  const baseDirection = hashSeed(fixture.id + ":wind") % 360;
  return {
    irradiancePoaWm2: poa,
    horizontalIrradianceWm2: round(poa * 0.93, 0),
    ambientTempC: record.connected ? round(ambient, 1) : 0,
    moduleTempC: record.connected ? round(ambient + 0.028 * poa, 1) : 0,
    windSpeedMs: record.connected ? round((1.2 + 2.5 * sun) * j(0.15, 6), 1) : 0,
    windDirectionDeg: record.connected ? Math.round((baseDirection + 40 * Math.sin((hour / 24) * 2 * Math.PI) + 360) % 360) : 0,
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
