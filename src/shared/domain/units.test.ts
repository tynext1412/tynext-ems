import { describe, expect, it } from "vitest";
import { formatIDR, formatKWh, formatNumber, scaleEnergy, scaleIDR } from "./units";

describe("units", () => {
  it("formats numbers with Indonesian separators", () => {
    expect(formatNumber(1250.4)).toBe("1.250,40");
    expect(formatNumber(0)).toBe("0,00");
    expect(formatKWh(180300.5)).toBe("180.300,50 kWh");
    expect(formatIDR(260482000)).toBe("Rp 260.482.000");
  });

  it("scales energy to the largest readable unit", () => {
    expect(scaleEnergy(950)).toEqual({ value: "950,00", unit: "kWh" });
    expect(scaleEnergy(1_500_000)).toEqual({ value: "1.500,00", unit: "MWh" });
    expect(scaleEnergy(35_093_936)).toEqual({ value: "35.093,94", unit: "MWh" });
    expect(scaleEnergy(2_000_000_000)).toEqual({ value: "2.000,00", unit: "GWh" });
  });

  it("scales rupiah to K/M/B/T", () => {
    expect(scaleIDR(43_396_698_905)).toEqual({ value: "43,40", unit: "B" });
    expect(scaleIDR(2_400_000)).toEqual({ value: "2,40", unit: "M" });
    expect(scaleIDR(753_210)).toEqual({ value: "753,21", unit: "K" });
    expect(scaleIDR(500)).toEqual({ value: "500", unit: "" });
  });
});
