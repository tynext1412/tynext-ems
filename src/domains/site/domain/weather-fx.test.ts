import { describe, expect, it } from "vitest";
import { FLASH_DURATION, flashLevel, lightningBolt, nextFlashDelay, WEATHER_FX } from "./weather-fx";

describe("weather effects", () => {
  it("gets heavier and darker from clear to thunderstorm", () => {
    expect(WEATHER_FX.CLEAR.rain).toBe(0);
    expect(WEATHER_FX.CLEAR.sun).toBe(true);
    expect(WEATHER_FX.RAIN.rain).toBeGreaterThan(0);
    expect(WEATHER_FX.THUNDERSTORM.rain).toBeGreaterThan(WEATHER_FX.RAIN.rain);
    expect(WEATHER_FX.THUNDERSTORM.lightning).toBe(true);
    const order = ["CLEAR", "PARTLY_CLOUDY", "CLOUDY", "RAIN", "THUNDERSTORM"] as const;
    for (let i = 1; i < order.length; i++) {
      expect(WEATHER_FX[order[i]].light.sun).toBeLessThan(WEATHER_FX[order[i - 1]].light.sun);
      expect(WEATHER_FX[order[i]].clouds).toBeGreaterThanOrEqual(WEATHER_FX[order[i - 1]].clouds);
    }
  });

  it("draws a deterministic bolt from the clouds down to the stage", () => {
    const bolt = lightningBolt(42, 1, -2);
    expect(lightningBolt(42, 1, -2)).toEqual(bolt);
    expect(bolt[0]).toEqual([1, 5.6, -2]);
    expect(bolt.at(-1)?.[1]).toBeCloseTo(0);
    for (let i = 1; i < bolt.length; i++) expect(bolt[i][1]).toBeLessThan(bolt[i - 1][1]);
  });

  it("flashes twice and stays dark between strikes", () => {
    expect(flashLevel(0)).toBe(1); // frame pemicu selalu menyala, berapa pun frame rate-nya
    expect(flashLevel(0.05)).toBe(1);
    expect(flashLevel(0.12)).toBe(0);
    expect(flashLevel(0.2)).toBe(1);
    expect(flashLevel(0.28)).toBe(0);
    expect(flashLevel(FLASH_DURATION)).toBe(0);
    expect(flashLevel(-1)).toBe(0);
    expect(nextFlashDelay(0)).toBe(4);
    expect(nextFlashDelay(1)).toBe(9);
  });
});
