import { describe, expect, it } from "vitest";
import { countDeviceStatus, deviceStatus, warrantyStatus, type DeviceRecord, type InverterRecord, type MeterRecord } from "./device";
import { applyDeviceListQuery, DEFAULT_DEVICE_LIST_QUERY, sameKindDevices } from "./device-list";
import { DEFAULT_PARAMETERS, DEVICE_PARAMETERS, groupByUnit } from "./parameters";
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
    const groups = groupByUnit(DEVICE_PARAMETERS.INVERTER.filter((p) => ["powerKW", "acVoltageL1V", "acVoltageL2V", "acCurrentL1A"].includes(p.key)));
    expect(groups.map((g) => [g.unit, g.params.length])).toEqual([
      ["kW", 1],
      ["V", 2],
      ["A", 1],
    ]);
  });
});

describe("sameKindDevices", () => {
  const meter: MeterRecord = {
    kind: "METER",
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
  it("offers Inverter, Battery, PCS and Meter, each with a catalog and valid defaults", () => {
    expect(DEVICE_KINDS).toEqual(["INVERTER", "BATTERY", "PCS", "METER"]);
    for (const kind of DEVICE_KINDS) {
      const keys = new Set(DEVICE_PARAMETERS[kind].map((p) => p.key));
      expect(keys.size).toBeGreaterThan(0);
      for (const d of DEFAULT_PARAMETERS[kind]) expect(keys.has(d)).toBe(true);
    }
    expect(DEVICE_PARAMETERS.PCS.filter((p) => p.kind === "energy").map((p) => p.key)).toEqual(["dailyChargeKWh", "dailyDischargeKWh"]);
  });
});
