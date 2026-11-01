import { describe, expect, it } from "vitest";
import { MockPerformanceRepository } from "@/domains/performance/infrastructure/mock-performance-repository";
import { plantFixtures } from "@/domains/plant/infrastructure/fixtures";
import { MockTelemetryRepository } from "@/domains/telemetry/infrastructure/mock-telemetry-repository";
import { catalogIdFor, PARAMETER_CATALOGS, type ParameterCatalogId } from "../domain/parameters";
import { buildDeviceRecords } from "./mock-device-repository";
import { MockDeviceTelemetryRepository } from "./mock-device-telemetry-repository";

// PLT-007: site tambang dengan baterai → punya semua jenis meter (STG, PV, Load, ESS, DEG, power sensor) dan EMI.
const fixture = plantFixtures.find((f) => f.id === "PLT-007")!;
const now = () => new Date("2026-10-28T05:00:00Z"); // 12:00 WIB, matahari tinggi
const today = "2026-10-28";

function repository() {
  const telemetry = new MockTelemetryRepository(plantFixtures, now);
  const performance = new MockPerformanceRepository(plantFixtures, now);
  return new MockDeviceTelemetryRepository(telemetry, performance, plantFixtures, now);
}

describe("mock device telemetry", () => {
  const records = buildDeviceRecords(fixture);

  it("builds every meter type and an EMI for a mining site with storage", () => {
    const meterTypes = records.flatMap((r) => (r.kind === "METER" ? [r.meterType] : []));
    expect(meterTypes.sort()).toEqual(["DEG", "ESS", "LOAD", "POWER_SENSOR", "PV", "STG"]);
    expect(records.filter((r) => r.kind === "EMI")).toHaveLength(1);
  });

  it("produces a value for every chart parameter of each catalog", async () => {
    const repo = repository();
    // Satu perangkat per katalog parameter.
    const byCatalog = new Map<ParameterCatalogId, (typeof records)[number]>();
    for (const r of records) if (!byCatalog.has(catalogIdFor(r))) byCatalog.set(catalogIdFor(r), r);
    expect([...byCatalog.keys()].sort()).toEqual(["BATTERY", "EMI", "GRID_METER", "INVERTER", "PCS", "POWER_SENSOR"]);

    await Promise.all(
      [...byCatalog.entries()].map(async ([id, device]) => {
        const [daily, energy, latest] = await Promise.all([repo.dailySeries(device.id, today), repo.energySeries(device.id, "month", today), repo.latest(device.id)]);
        const instant = PARAMETER_CATALOGS[id].filter((p) => p.kind === "instant").map((p) => p.key);
        const energyKeys = PARAMETER_CATALOGS[id].filter((p) => p.kind === "energy").map((p) => p.key);
        expect(daily.length, id).toBeGreaterThan(0);
        for (const key of instant) expect(Number.isFinite(daily[0].values[key]), `${id}.${key}`).toBe(true);
        for (const key of energyKeys) expect(Number.isFinite(energy[0]?.values[key]), `${id}.${key}`).toBe(true);
        expect(latest?.kind).toBe(device.kind);
      }),
    );
  });

  it("keeps meter, battery and weather readings physically consistent", async () => {
    const repo = repository();
    const stg = records.find((r) => r.kind === "METER" && r.meterType === "STG")!;
    const sensor = records.find((r) => r.kind === "METER" && r.meterType === "POWER_SENSOR")!;
    const battery = records.find((r) => r.kind === "BATTERY")!;
    const emi = records.find((r) => r.kind === "EMI")!;
    const [m, ps, b, w] = await Promise.all([repo.latest(stg.id), repo.latest(sensor.id), repo.latest(battery.id), repo.latest(emi.id)]);

    if (m?.kind !== "METER" || ps?.kind !== "METER" || b?.kind !== "BATTERY" || w?.kind !== "EMI") throw new Error("unexpected reading kinds");
    // Daya per fasa menjumlah ke daya total (toleransi pembulatan).
    expect(Math.abs(m.phases.reduce((sum, p) => sum + p.activePowerKW, 0) - m.activePowerKW)).toBeLessThan(0.3);
    expect(m.apparentPowerKVA).toBeGreaterThanOrEqual(Math.abs(m.activePowerKW) - 0.1);
    // Power sensor: ada Meter Status, tanpa daya semu dan daya reaktif per fasa.
    expect(ps.meterStatus).toBe("NORMAL");
    expect(ps.apparentPowerKVA).toBeUndefined();
    expect(ps.phases.every((p) => p.reactivePowerKvar === undefined)).toBe(true);
    // ESS: energi tersedia = kapasitas × SOH, dibagi sesuai SOC; satu baris per rak.
    expect(b.chargeableEnergyKWh + b.dischargeableEnergyKWh).toBeCloseTo((b.ratedCapacityKWh * b.sohPercent) / 100, -1);
    expect(b.racks).toHaveLength(battery.kind === "BATTERY" ? battery.rackCount : 0);
    expect(b.maxCellVoltageV).toBeGreaterThan(b.minCellVoltageV);
    // EMI tengah hari: iradiansi positif, modul lebih panas dari udara.
    expect(w.irradiancePoaWm2).toBeGreaterThan(500);
    expect(w.moduleTempC).toBeGreaterThan(w.ambientTempC);
    expect(w.dailyIrradiationPoaKWhM2).toBeGreaterThan(0);
  });
});
