import { describe, expect, it } from "vitest";
import type { MeterRecord } from "@/domains/device/domain/device";
import type { OperatingData } from "@/domains/performance/domain/performance";
import { buildDeviceReport, buildOverviewReport, reportFilename, reportPeriodLabel } from "./reports";

const plant = { id: "PLT-003", name: "Pabrik Kelapa Sawit Siak", timezone: "Asia/Jakarta", commissionedAt: "2024-09-01", hasBattery: true };
const operating: OperatingData = {
  pvProductionKWh: 3361.316,
  bessChargeKWh: 331,
  bessDischargeKWh: 304,
  dieselGeneratorKWh: 0,
  loadConsumptionKWh: 11745.15,
  dayOperation: 1,
  hoursOperation: 10.62,
  revenueIDR: 3481234.5,
};
const generatedAt = new Date("2026-11-02T01:15:00Z"); // 08:15 WIB

describe("overview report", () => {
  it("has three sheets for Day: operating data, daily power, SOC & tariff", () => {
    const sheets = buildOverviewReport({
      plant,
      period: { granularity: "day", date: "2026-11-02" },
      generatedAt,
      operating,
      daily: [{ t: 0, grid: 120.04, pv: 0, battery: -50, genset: 0, load: 170.04, soc: 41 }],
      socTariff: [{ t: 0, soc: 41, purchase: 1444.7, feedIn: 1035.78 }, { t: 60, purchase: 1444.7, feedIn: 1035.78 }],
    });
    expect(sheets.map((s) => s.name)).toEqual(["Operating Data", "Daily Power", "Battery SOC & Tariff"]);
    expect(sheets[0].meta).toContainEqual(["Period", "Day · 2 Nov 2026"]);
    expect(sheets[0].meta).toContainEqual(["Generated", "2026-11-02 08:15 WIB"]);
    expect(sheets[0].rows[0]).toEqual(["PV Production", 3361.32, "kWh"]);
    expect(sheets[0].rows[3]).toEqual(["Diesel Generator", "Not Installed", null]);
    expect(sheets[1].columns[0]).toBe("Time (WIB)");
    expect(sheets[1].rows[0]).toEqual(["00:00", 120, 0, -50, 0, 170]);
    expect(sheets[2].columns).toEqual(["Time (WIB)", "SOC (%)", "Purchase Tariff (Rp/kWh)", "Feed-in Tariff (Rp/kWh)"]);
    expect(sheets[2].rows[1]).toEqual(["01:00", undefined, 1444.7, 1035.78]); // menit tanpa sampel SOC
  });

  it("has two sheets for Month/Year/Lifetime and drops battery columns without storage", () => {
    const sheets = buildOverviewReport({
      plant: { ...plant, hasBattery: false },
      period: { granularity: "year", date: "2026-11-02" },
      generatedAt,
      operating,
      energy: [{ key: "2026-01", label: "Jan", pv: 100, import: 50, export: 5, charge: 0, discharge: 0, consumption: 145 }],
    });
    expect(sheets.map((s) => s.name)).toEqual(["Operating Data", "Energy per month"]);
    expect(sheets[1].columns).toEqual(["Month", "PV (kWh)", "Import (kWh)", "Export (kWh)", "Consumption (kWh)"]);
    expect(sheets[1].rows[0]).toEqual(["2026-01", 100, 50, 5, 145]);
  });

  it("labels periods and names files", () => {
    expect(reportPeriodLabel({ granularity: "month", date: "2026-11-01" })).toBe("Month · Nov 2026");
    expect(reportPeriodLabel({ granularity: "lifetime", date: "2026-11-02" }, "2024-09-01")).toBe("Lifetime · since 1 Sep 2024");
    expect(reportFilename("PLT-003", { granularity: "day", date: "2026-11-02" })).toBe("Tynext-Report_PLT-003_Day_2026-11-02.xlsx");
    expect(reportFilename("PLT-003-MTR-01", { granularity: "month", date: "2026-11-01" })).toBe("Tynext-Report_PLT-003-MTR-01_Month_2026-11.xlsx");
    expect(reportFilename("PLT-003", { granularity: "lifetime", date: "2026-11-02" })).toBe("Tynext-Report_PLT-003_Lifetime.xlsx");
  });
});

describe("device report", () => {
  const meter: MeterRecord = {
    kind: "METER",
    meterType: "PV",
    id: "PLT-003-MTR-02",
    plantId: "PLT-003",
    plantName: plant.name,
    name: "PV Meter 1",
    serialNumber: "1057",
    vendor: "Acrel",
    model: "Acrel 3P4W CT Meter",
    dataloggerId: "PLT-003-LOG-01",
    address: 12,
    connected: true,
    activeAlarms: 0,
    firmwareVersion: "v2.1.3",
    commissionedAt: "2024-09-01",
  };
  const kw = { key: "activePowerKW", label: "Active Power", unit: "kW", group: "Power", kind: "instant" as const, fractionDigits: 1 };
  const pf = { key: "powerFactor", label: "Power Factor", unit: "", group: "Power", kind: "instant" as const, fractionDigits: 3 };

  it("adds a device sheet and one sheet per displayed chart", () => {
    const sheets = buildDeviceReport({
      device: meter,
      plant,
      period: { granularity: "day", date: "2026-11-02" },
      generatedAt,
      groups: [
        { unit: "kW", params: [kw] },
        { unit: "", params: [pf] },
      ],
      daily: [{ t: 720, activePowerKW: 512.34, powerFactor: 0.97123 }],
    });
    expect(sheets.map((s) => s.name)).toEqual(["Device", "Chart kW", "Chart (no unit)"]);
    expect(sheets[0].rows).toContainEqual(["Device Type", "PV Meter"]);
    expect(sheets[1].columns).toEqual(["Time (WIB)", "Active Power (kW)"]);
    expect(sheets[1].rows[0]).toEqual(["12:00", 512.3]);
    expect(sheets[2].rows[0]).toEqual(["12:00", 0.971]);
  });
});
