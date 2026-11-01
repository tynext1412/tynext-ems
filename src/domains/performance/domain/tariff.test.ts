import { describe, expect, it } from "vitest";
import { bandHours, hasTariffErrors, parseRate, rateAt, tariffSegments, validateTariff, type PurchaseTariff } from "./tariff";

const tou = (bands: PurchaseTariff["bands"], base = 1000): PurchaseTariff => ({ mode: "TIME_OF_USE", baseRateIDRPerKWh: base, bands });

describe("purchase tariff", () => {
  it("covers hours of a band, including bands that cross midnight", () => {
    expect(bandHours({ startHour: 17, endHour: 22, rateIDRPerKWh: 1 })).toEqual([17, 18, 19, 20, 21]);
    expect(bandHours({ startHour: 22, endHour: 2, rateIDRPerKWh: 1 })).toEqual([22, 23, 0, 1]);
    expect(bandHours({ startHour: 20, endHour: 24, rateIDRPerKWh: 1 })).toEqual([20, 21, 22, 23]);
    expect(bandHours({ startHour: 5, endHour: 5, rateIDRPerKWh: 1 })).toEqual([]);
  });

  it("returns the band rate inside a period and the base rate elsewhere", () => {
    const t = tou([{ startHour: 17, endHour: 22, rateIDRPerKWh: 1400 }]);
    expect(rateAt(t, 16)).toBe(1000);
    expect(rateAt(t, 17)).toBe(1400);
    expect(rateAt(t, 21)).toBe(1400);
    expect(rateAt(t, 22)).toBe(1000);
    expect(rateAt(t, 24)).toBe(1000); // jam 24 = 00:00 hari berikutnya
    expect(rateAt({ ...t, mode: "FLAT" }, 18)).toBe(1000); // flat mengabaikan periode
  });

  it("splits the day into contiguous segments", () => {
    const t = tou([{ startHour: 22, endHour: 6, rateIDRPerKWh: 800 }, { startHour: 17, endHour: 22, rateIDRPerKWh: 1400 }]);
    expect(tariffSegments(t).map((s) => [s.startHour, s.endHour, s.rateIDRPerKWh])).toEqual([
      [0, 6, 800],
      [6, 17, 1000],
      [17, 22, 1400],
      [22, 24, 800],
    ]);
  });

  it("validates rates, empty and overlapping periods", () => {
    expect(hasTariffErrors(validateTariff({ mode: "FLAT", baseRateIDRPerKWh: 1444.7, bands: [] }))).toBe(false);
    expect(validateTariff({ mode: "FLAT", baseRateIDRPerKWh: 0, bands: [] }).base).toBeDefined();
    expect(validateTariff(tou([])).form).toMatch(/at least one period/);

    const errors = validateTariff(
      tou([
        { startHour: 17, endHour: 22, rateIDRPerKWh: 1400 },
        { startHour: 21, endHour: 23, rateIDRPerKWh: 1200 },
        { startHour: 3, endHour: 3, rateIDRPerKWh: 900 },
        { startHour: 8, endHour: 9, rateIDRPerKWh: -1 },
      ]),
    );
    expect(errors.bands).toEqual([undefined, "Overlaps with period 1", "Start and end must be different hours", "Enter a rate above Rp 0"]);
    expect(hasTariffErrors(errors)).toBe(true);

    expect(validateTariff(tou([{ startHour: 0, endHour: 12, rateIDRPerKWh: 1 }, { startHour: 12, endHour: 24, rateIDRPerKWh: 2 }])).form).toMatch(/all 24 hours/);
  });

  it("parses rates typed in Indonesian or plain decimal format", () => {
    expect(parseRate("1.444,70")).toBe(1444.7);
    expect(parseRate("1444.7")).toBe(1444.7);
    expect(parseRate("Rp 2.022,58")).toBe(2022.58);
    expect(parseRate("1500")).toBe(1500);
    expect(parseRate("")).toBeNaN();
    expect(parseRate("abc")).toBeNaN();
    expect(parseRate("-5")).toBeNaN();
  });
});
