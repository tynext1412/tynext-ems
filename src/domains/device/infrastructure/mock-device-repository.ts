import type { PlantId } from "@/domains/plant/domain/plant";
import { plantFixtures, type PlantFixture } from "@/domains/plant/infrastructure/fixtures";
import { addDays, hashSeed } from "@/shared/domain/time";
import type { DeviceRepository } from "../application/device-repository";
import type { BatteryRecord, DeviceRecord, InverterRecord, MeterRecord, PcsRecord } from "../domain/device";

// Record perangkat dummy diturunkan dari device fixture plant supaya status,
// dan jumlah alarm konsisten dengan status plant di dashboard.
function serialFor(id: string): string {
  const a = hashSeed(id);
  const b = hashSeed(id + ":sn");
  return `${String(a).padStart(10, "0").slice(0, 10)}${String(b).padStart(6, "0").slice(0, 6)}`;
}

export function buildDeviceRecords(fixture: PlantFixture): DeviceRecord[] {
  const base = (id: string, name: string, vendor: string) => ({
    id,
    plantId: fixture.id,
    plantName: fixture.name,
    name,
    serialNumber: serialFor(id),
    vendor,
    dataloggerId: `${fixture.id}-LOG-01`,
    firmwareVersion: `v2.${hashSeed(id) % 7}.${hashSeed(id + "fw") % 10}`,
    commissionedAt: fixture.commissionedAt,
  });

  const inverters = fixture.devices.filter((d) => d.type === "INVERTER");
  const ratedKW = inverters.length > 0 ? Math.round((fixture.capacity.inverterKW / inverters.length) * 10) / 10 : 0;

  const records: DeviceRecord[] = inverters.map<InverterRecord>((d, i) => ({
    kind: "INVERTER",
    ...base(d.id, `Inverter ${i + 1}`, d.vendor),
    model: `${d.vendor} ${ratedKW} kW 3P`,
    series: `${d.vendor.slice(0, 3).toUpperCase()}-${Math.round(ratedKW)}K`,
    address: i + 1,
    connected: d.connected,
    activeAlarms: d.activeAlarms,
    ratedPowerKW: ratedKW,
    warrantyExpiresAt: addDays(fixture.commissionedAt, 365 * 5),
    nationalStandard: "PLN 230/400 V 50 Hz",
    stringCount: 4,
    isMaster: i === 0 && inverters.length > 1,
  }));

  const batteries = fixture.devices.filter((d) => d.type === "BATTERY");
  const unitKWh = batteries.length > 0 ? Math.round((fixture.capacity.batteryKWh / batteries.length) * 10) / 10 : 0;
  batteries.forEach((d, i) => {
    records.push({
      kind: "BATTERY",
      ...base(d.id, `Battery ${i + 1}`, d.vendor),
      model: `${d.vendor} LFP HV ${Math.round(unitKWh)} kWh`,
      address: inverters.length + 1 + i,
      connected: d.connected,
      activeAlarms: d.activeAlarms,
      batteryType: "Lithium (LFP) HV",
      capacityKWh: unitKWh,
      maxChargeCurrentA: 50,
      maxDischargeCurrentA: 100,
      packCount: Math.max(1, Math.round(unitKWh / 5)),
      modulesInSeries: 16,
      parallelConnections: Math.max(1, Math.round(unitKWh / 100)),
    } satisfies BatteryRecord);
  });

  // PCS: daya nominal ≈ 0,5C dari kapasitas baterai yang dilayani; baterai dibagi 2 unit per PCS.
  const pcsDevices = fixture.devices.filter((d) => d.type === "PCS");
  const pcsRatedKW = pcsDevices.length > 0 ? Math.round((fixture.capacity.batteryKWh / pcsDevices.length) * 0.5) : 0;
  pcsDevices.forEach((d, i) => {
    records.push({
      kind: "PCS",
      ...base(d.id, `PCS ${i + 1}`, d.vendor),
      model: `${d.vendor} PCS ${pcsRatedKW} kW`,
      series: `${d.vendor.slice(0, 3).toUpperCase()}-PCS${pcsRatedKW}`,
      address: inverters.length + batteries.length + 1 + i,
      connected: d.connected,
      activeAlarms: d.activeAlarms,
      ratedPowerKW: pcsRatedKW,
      maxChargeKW: pcsRatedKW,
      maxDischargeKW: pcsRatedKW,
      acVoltage: "230/400 V 3P",
      dcVoltageMinV: 600,
      dcVoltageMaxV: 900,
      coupling: "AC",
      coupledBatteryIds: batteries.slice(i * 2, i * 2 + 2).map((b) => b.id),
      warrantyExpiresAt: addDays(fixture.commissionedAt, 365 * 5),
    } satisfies PcsRecord);
  });

  fixture.devices
    .filter((d) => d.type === "METER")
    .forEach((d, i) => {
      records.push({
        kind: "METER",
        ...base(d.id, `Meter ${i + 1}`, d.vendor),
        model: `${d.vendor} 3P4W CT`,
        address: inverters.length + batteries.length + pcsDevices.length + 1 + i,
        connected: d.connected,
        activeAlarms: d.activeAlarms,
      } satisfies MeterRecord);
    });

  return records;
}

export class MockDeviceRepository implements DeviceRepository {
  private readonly byPlant = new Map<PlantId, DeviceRecord[]>();
  private readonly byId = new Map<string, DeviceRecord>();

  constructor(fixtures: PlantFixture[] = plantFixtures) {
    for (const f of fixtures) {
      const records = buildDeviceRecords(f);
      this.byPlant.set(f.id, records);
      for (const r of records) this.byId.set(r.id, r);
    }
  }

  async findByPlant(plantId: PlantId): Promise<DeviceRecord[]> {
    await delay(250);
    return (this.byPlant.get(plantId) ?? []).map((r) => ({ ...r }));
  }

  async findById(deviceId: string): Promise<DeviceRecord | null> {
    await delay(250);
    const r = this.byId.get(deviceId);
    return r ? { ...r } : null;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
