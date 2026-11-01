import { describe, expect, it } from "vitest";
import { countDeviceStatus, deviceStatus, warrantyStatus, type DeviceRecord, type InverterRecord, type MeterRecord } from "./device";
import { applyDeviceListQuery, DEFAULT_DEVICE_LIST_QUERY, sameKindDevices } from "./device-list";
import { catalogIdFor, DEFAULT_PARAMETERS, groupByUnit, PARAMETER_CATALOGS, parametersFor, type ParameterCatalogId } from "./parameters";
import { DEVICE_KINDS } from "./device";

function inverter(partial: Partial<InverterRecord> & Pick<InverterRecord, "id" | "name">): InverterRecord {
  return {
    kind: "INVERTER",
    plantId: "PLT-1",
    plantName: "Plant",
    serialNumber: "SN",
    vendor: "Vendor",
    model: "M",
    dataloggerId: "LOG",
    address: 1,
    connected: true,
    activeAlarms: 0,
    firmwareVersion: "v1",
    commissionedAt: "2024-01-01",
    series: "S",
    ratedPowerKW: 50,
    warrantyExpiresAt: "2029-01-01",
    nationalStandard: "PLN",
    stringCount: 4,
    isMaster: false,
    ...partial,
  };
}

describe("device status", () => {
  it("derives status from connectivity and alarms", () => {
    expect(deviceStatus({ connected: true, activeAlarms: 0 })).toBe("ONLINE");
    expect(deviceStatus({ connected: true, activeAlarms: 2 })).toBe("ALARM");
    expect(deviceStatus({ connected: false, activeAlarms: 2 })).toBe("OFFLINE");
  });

  it("counts per status and checks warranty", () => {
    const devices: DeviceRecord[] = [inverter({ id: "a", name: "Inverter 1" }), inverter({ id: "b", name: "Inverter 2", connected: false })];
    expect(countDeviceStatus(devices)).toEqual({ ONLINE: 1, ALARM: 0, OFFLINE: 1 });
    expect(warrantyStatus("2029-01-01", "2026-10-27")).toBe("IN_WARRANTY");
    expect(warrantyStatus("2026-01-01", "2026-10-27")).toBe("EXPIRED");
  });
});

describe("device list query", () => {
  const devices: DeviceRecord[] = [
    inverter({ id: "i10", name: "Inverter 10", serialNumber: "1053050252200013" }),
    inverter({ id: "i2", name: "Inverter 2", serialNumber: "1053050251030013", activeAlarms: 1 }),
    inverter({ id: "i1", name: "Inverter 1", serialNumber: "1053050251030006", connected: false }),
  ];

  it("filters by kind, status, and search, sorting names numerically", () => {
    const all = applyDeviceListQuery(devices, { ...DEFAULT_DEVICE_LIST_QUERY, kind: "INVERTER" });
    expect(all.items.map((d) => d.name)).toEqual(["Inverter 1", "Inverter 2", "Inverter 10"]);
    expect(applyDeviceListQuery(devices, { ...DEFAULT_DEVICE_LIST_QUERY, kind: "INVERTER", status: "ALARM" }).items.map((d) => d.id)).toEqual(["i2"]);
    expect(applyDeviceListQuery(devices, { ...DEFAULT_DEVICE_LIST_QUERY, kind: "INVERTER", search: "2200013" }).totalItems).toBe(1);
    expect(applyDeviceListQuery(devices, { ...DEFAULT_DEVICE_LIST_QUERY, kind: "BATTERY" }).totalItems).toBe(0);
  });

  it("paginates and clamps", () => {
    const page = applyDeviceListQuery(devices, { ...DEFAULT_DEVICE_LIST_QUERY, kind: "INVERTER", pageSize: 2, page: 5 });
    expect(page.page).toBe(2);
    expect(page.items).toHaveLength(1);
  });
});

describe("parameters", () => {
  it("groups parameters by unit so no chart needs two axes", () => {
    // Tegangan line dan tegangan fasa sama-sama Volt, jadi satu chart.
    const groups = groupByUnit(PARAMETER_CATALOGS.INVERTER.filter((p) => ["activePowerKW", "lineVoltageABV", "phaseAVoltageV", "phaseACurrentA", "reactivePowerKvar"].includes(p.key)));
    expect(groups.map((g) => [g.unit, g.params.length])).toEqual([
      ["kW", 1],
      ["kvar", 1],
      ["V", 2],
      ["A", 1],
    ]);
  });
});

describe("sameKindDevices", () => {
  const meter: MeterRecord = {
    kind: "METER",
    meterType: "STG",
    id: "MTR-1",
    plantId: "PLT-1",
    plantName: "Plant",
    name: "Meter 1",
    serialNumber: "SN-MTR",
    vendor: "Acrel",
    model: "M",
    dataloggerId: "LOG",
    address: 9,
    connected: true,
    activeAlarms: 0,
    firmwareVersion: "v1",
    commissionedAt: "2024-01-01",
  };
  const devices: DeviceRecord[] = [inverter({ id: "INV-10", name: "Inverter 10" }), meter, inverter({ id: "INV-2", name: "Inverter 2", serialNumber: "ABC123" }), inverter({ id: "INV-1", name: "Inverter 1" })];

  it("keeps only the requested kind, sorted numerically by name", () => {
    expect(sameKindDevices(devices, "INVERTER", "").map((d) => d.name)).toEqual(["Inverter 1", "Inverter 2", "Inverter 10"]);
    expect(sameKindDevices(devices, "METER", "").map((d) => d.id)).toEqual(["MTR-1"]);
    expect(sameKindDevices(devices, "BATTERY", "")).toEqual([]);
  });

  it("filters by name or serial number within the kind", () => {
    expect(sameKindDevices(devices, "INVERTER", "abc").map((d) => d.id)).toEqual(["INV-2"]);
    expect(sameKindDevices(devices, "INVERTER", "meter")).toEqual([]);
  });
});

describe("device kinds", () => {
  it("offers Inverter, Battery, PCS, Meter and EMI; every catalog has unique keys and valid defaults", () => {
    expect(DEVICE_KINDS).toEqual(["INVERTER", "BATTERY", "PCS", "METER", "EMI"]);
    for (const id of Object.keys(PARAMETER_CATALOGS) as ParameterCatalogId[]) {
      const keys = PARAMETER_CATALOGS[id].map((p) => p.key);
      expect(new Set(keys).size).toBe(keys.length);
      for (const d of DEFAULT_PARAMETERS[id]) expect(keys).toContain(d);
    }
    expect(PARAMETER_CATALOGS.PCS.filter((p) => p.kind === "energy").map((p) => p.key)).toEqual(["dailyChargeKWh", "dailyDischargeKWh"]);
  });

  it("uses the Grid Meter catalog for STG/DEG/ESS/PV/Load meters and its own catalog for the power sensor", () => {
    for (const meterType of ["STG", "DEG", "ESS", "PV", "LOAD"]) expect(catalogIdFor({ kind: "METER", meterType })).toBe("GRID_METER");
    expect(catalogIdFor({ kind: "METER", meterType: "POWER_SENSOR" })).toBe("POWER_SENSOR");
    expect(catalogIdFor({ kind: "EMI" })).toBe("EMI");
    // Power sensor tidak punya daya reaktif per fasa dan daya semu.
    const sensorKeys = parametersFor({ kind: "METER", meterType: "POWER_SENSOR" }).map((p) => p.key);
    expect(sensorKeys).not.toContain("apparentPowerKVA");
    expect(sensorKeys).not.toContain("reactivePowerAKvar");
    expect(parametersFor({ kind: "METER", meterType: "PV" }).map((p) => p.key)).toContain("apparentPowerKVA");
  });
});
