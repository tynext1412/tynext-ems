import { describe, expect, it } from "vitest";
import { bucketLabel, dailyPowerPoints, energyBarPoints, formatMinutes, minutesOfDay, tariffPoints } from "./chart-data";

describe("chart-data", () => {
  it("converts sample timestamps to minutes of the plant's local day", () => {
    expect(minutesOfDay("2026-10-26T01:05:00Z", "Asia/Makassar")).toBe(545); // 09:05 WITA
    expect(formatMinutes(545)).toBe("09:05");
    expect(formatMinutes(1440)).toBe("00:00");
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

  it("labels buckets by granularity and negates charge", () => {
    expect(bucketLabel("2026-10-05")).toBe("5");
    expect(bucketLabel("2026-03")).toBe("Mar");
    expect(bucketLabel("2025")).toBe("2025");
    const [bar] = energyBarPoints([{ key: "2026-10-05", pvProductionKWh: 100, gridSupplyKWh: 20, chargeKWh: 30, dischargeKWh: 27, generatorSupplyKWh: 0, loadKWh: 117 }]);
    expect(bar.charge).toBe(-30);
    expect(bar.label).toBe("5");
  });
});
