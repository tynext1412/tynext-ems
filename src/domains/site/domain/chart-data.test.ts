import { describe, expect, it } from "vitest";
import { bucketLabel, dailyPowerPoints, energyBarPoints, formatMinutes, minutesOfDay, socTariffPoints, tariffPoints } from "./chart-data";

describe("chart-data", () => {
  it("converts sample timestamps to minutes of the plant's local day", () => {
    expect(minutesOfDay("2026-10-26T01:05:00Z", "Asia/Makassar")).toBe(545); // 09:05 WITA
    expect(formatMinutes(545)).toBe("09:05");
    expect(formatMinutes(1440)).toBe("24:00"); // batas akhir hari pada sumbu
  });

  it("maps power samples keeping the spec sign convention", () => {
    const [p] = dailyPowerPoints(
      [{ at: "2026-10-26T04:00:00Z", pvKW: 80, loadKW: 50, gensetKW: 0, batteryKW: 20, gridKW: -10, socPercent: 70 }],
      "Asia/Jakarta",
    );
    expect(p).toEqual({ t: 660, grid: -10, pv: 80, battery: 20, genset: 0, load: 50, soc: 70 });
  });

  it("closes the tariff day at minute 1440", () => {
    const pts = tariffPoints(
      [
        { at: "2026-10-25T17:00:00Z", purchaseIDRPerKWh: 1000, feedInIDRPerKWh: 900 },
        { at: "2026-10-26T17:00:00Z", purchaseIDRPerKWh: 1000, feedInIDRPerKWh: 900 },
      ],
      "Asia/Jakarta",
    );
    expect(pts.map((p) => p.t)).toEqual([0, 1440]);
  });

  it("merges SOC samples with the tariff in force at each minute", () => {
    const soc = (t: number, v: number) => ({ t, grid: 0, pv: 0, battery: 0, genset: 0, load: 0, soc: v });
    const rows = socTariffPoints(
      [soc(0, 50), soc(5, 51), soc(65, 60)],
      [
        { t: 0, purchase: 1000, feedIn: 900 },
        { t: 60, purchase: 1500, feedIn: 950 },
        { t: 1440, purchase: 1000, feedIn: 900 },
      ],
    );
    expect(rows).toEqual([
      { t: 0, soc: 50, purchase: 1000, feedIn: 900 },
      { t: 5, soc: 51, purchase: 1000, feedIn: 900 },
      { t: 60, purchase: 1500, feedIn: 950 },
      { t: 65, soc: 60, purchase: 1500, feedIn: 950 },
      { t: 1440, purchase: 1000, feedIn: 900 },
    ]);
    expect(socTariffPoints([soc(0, 50)], [])).toEqual([{ t: 0, soc: 50 }]);
  });

  it("labels buckets by granularity and maps each energy flow to its own bar", () => {
    expect(bucketLabel("2026-10-05")).toBe("5");
    expect(bucketLabel("2026-03")).toBe("Mar");
    expect(bucketLabel("2025")).toBe("2025");
    const [bar] = energyBarPoints([{ key: "2026-10-05", pvProductionKWh: 100, gridSupplyKWh: 20, gridExportKWh: 6, chargeKWh: 30, dischargeKWh: 27, generatorSupplyKWh: 0, loadKWh: 111 }]);
    expect(bar).toEqual({ key: "2026-10-05", label: "5", pv: 100, import: 20, export: 6, charge: 30, discharge: 27, consumption: 111 });
  });
});
