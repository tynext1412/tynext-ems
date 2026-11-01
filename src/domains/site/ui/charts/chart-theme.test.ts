import { describe, expect, it } from "vitest";
import { axisNumber } from "./chart-theme";

describe("axisNumber", () => {
  it("keeps decimals on narrow ranges so ticks never repeat", () => {
    expect([7, 7.1, 7.2, 7.25].map(axisNumber)).toEqual(["7", "7,1", "7,2", "7,25"]);
    expect([24, 24.2, 24.4].map(axisNumber)).toEqual(["24", "24,2", "24,4"]);
    expect(axisNumber(-0.5)).toBe("-0,5");
  });

  it("compacts large and whole numbers", () => {
    expect(axisNumber(350)).toBe("350");
    expect(axisNumber(1500)).toBe("1,5K");
    expect(axisNumber(2_400_000)).toBe("2,4M");
  });
});
