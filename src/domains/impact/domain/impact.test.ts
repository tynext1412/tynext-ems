import { describe, expect, it } from "vitest";
import { calculateImpact } from "./impact";

describe("calculateImpact", () => {
  it("applies the dashboard formulas", () => {
    const impact = calculateImpact(180300.5);
    expect(impact.co2ReductionTon).toBeCloseTo(144.2404, 4);
    expect(impact.equivalentTrees).toBeCloseTo(6625.65, 2);
    expect(impact.coalSavedTon).toBeCloseTo(7.212, 3);
  });

  it("returns zero impact for zero energy", () => {
    expect(calculateImpact(0)).toEqual({ equivalentTrees: 0, co2ReductionTon: 0, coalSavedTon: 0 });
  });

  it("accepts custom factors", () => {
    const impact = calculateImpact(1000, { co2TonPerKWh: 0.001, co2KgPerKWh: 1, co2KgPerTreePerYear: 10, coalTonPerKWh: 0.0004 });
    expect(impact).toEqual({ equivalentTrees: 100, co2ReductionTon: 1, coalSavedTon: 0.4 });
  });
});
