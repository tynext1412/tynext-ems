import { describe, expect, it } from "vitest";
import { outageWidth } from "./outageAreas";

describe("outageWidth", () => {
  const oneSecond = { from: 600, to: 600 + 1 / 60, ongoing: false };

  it("satu hari penuh: putus 1 detik tetap terlihat ±4 menit", () => {
    expect(outageWidth(oneSecond)).toBeCloseTo(4.32, 2);
  });

  it("di-zoom 1 jam: minimum mengecil ke ±11 detik", () => {
    expect(outageWidth(oneSecond, [600, 660]) * 60).toBeCloseTo(10.8, 1);
  });

  it("outage panjang memakai durasi aslinya", () => {
    expect(outageWidth({ from: 600, to: 630, ongoing: false })).toBe(30);
    expect(outageWidth({ from: 600, to: 630, ongoing: false }, [600, 660])).toBe(30);
  });
});
