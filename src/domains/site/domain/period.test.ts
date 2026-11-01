import { describe, expect, it } from "vitest";
import { canStepBack, canStepForward, clampWindow, FULL_DAY, isFullDay, periodLabel, stepPeriod, zoomIn, zoomOut, zoomTicks } from "./period";
import { calendarWeeks, inRange, selectableYears, shiftMonth, zoomAround } from "./period";

describe("period navigation", () => {
  it("steps by day, month, and year", () => {
    expect(stepPeriod({ granularity: "day", date: "2026-10-31" }, 1).date).toBe("2026-11-01");
    expect(stepPeriod({ granularity: "month", date: "2026-01-15" }, -1).date).toBe("2025-12-01");
    expect(stepPeriod({ granularity: "month", date: "2026-12-01" }, 1).date).toBe("2027-01-01");
    expect(stepPeriod({ granularity: "year", date: "2026-10-26" }, -2).date).toBe("2024-01-01");
  });

  it("labels periods", () => {
    expect(periodLabel({ granularity: "day", date: "2026-10-26" })).toBe("26/10/2026");
    expect(periodLabel({ granularity: "month", date: "2026-10-01" })).toBe("10/2026");
    expect(periodLabel({ granularity: "year", date: "2026-01-01" })).toBe("2026");
    expect(periodLabel({ granularity: "lifetime", date: "2026-01-01" })).toBe("Lifetime");
  });

  it("blocks stepping past today or before commissioning", () => {
    const today = "2026-10-26";
    expect(canStepForward({ granularity: "day", date: "2026-10-26" }, today)).toBe(false);
    expect(canStepForward({ granularity: "day", date: "2026-10-25" }, today)).toBe(true);
    expect(canStepForward({ granularity: "month", date: "2026-10-01" }, today)).toBe(false);
    expect(canStepBack({ granularity: "year", date: "2024-01-01" }, "2024-06-01")).toBe(false);
    expect(canStepBack({ granularity: "day", date: "2024-06-02" }, "2024-06-01")).toBe(true);
    expect(canStepForward({ granularity: "lifetime", date: today }, today)).toBe(false);
  });
});

describe("time window zoom", () => {
  it("clamps to the day and enforces a minimum span", () => {
    expect(clampWindow(-20, 100)).toEqual([0, 100]);
    expect(clampWindow(600, 610)).toEqual([590, 620]);
    expect(clampWindow(1430, 1500)).toEqual([1410, 1440]);
  });

  it("zooms in around the centre and back out to the full day", () => {
    const zoomed = zoomIn(FULL_DAY);
    expect(zoomed).toEqual([360, 1080]);
    expect(zoomOut(zoomed)).toEqual(FULL_DAY);
    expect(isFullDay(zoomOut([700, 740]))).toBe(false);
  });

  it("picks tick steps by visible span", () => {
    expect(zoomTicks(FULL_DAY)).toEqual([0, 180, 360, 540, 720, 900, 1080, 1260, 1440]);
    expect(zoomTicks([540, 720])).toEqual([540, 570, 600, 630, 660, 690, 720]);
    expect(zoomTicks([600, 640])).toEqual([600, 605, 610, 615, 620, 625, 630, 635, 640]);
  });
});

describe("zoomAround", () => {
  it("shrinks the window around the anchor and grows it back to the full day", () => {
    expect(zoomAround([0, 1440], 720, 0.5)).toEqual([360, 1080]);
    expect(zoomAround([0, 1440], 0, 0.5)).toEqual([0, 720]);
    expect(zoomAround([360, 1080], 720, 2)).toEqual([0, 1440]);
    expect(zoomAround([600, 660], 630, 0.1)).toEqual([615, 645]); // dijepit ke rentang minimum 30 menit
    expect(zoomAround([360, 1080], 9999, 0.5)).toEqual([720, 1080]); // anchor di luar rentang dijepit ke tepi
  });
});

describe("period picker", () => {
  it("lays out a month Monday-first with padded weeks", () => {
    const weeks = calendarWeeks(2026, 11); // 1 Nov 2026 = Minggu
    expect(weeks[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks.flat().filter(Boolean)).toHaveLength(30);
    expect(weeks.at(-1)?.[0]).toBe("2026-11-30");
    expect(calendarWeeks(2024, 2).flat().filter(Boolean)).toHaveLength(29); // kabisat
  });

  it("shifts months across year boundaries", () => {
    expect(shiftMonth(2026, 1, -1)).toEqual([2025, 12]);
    expect(shiftMonth(2026, 12, 1)).toEqual([2027, 1]);
    expect(shiftMonth(2026, 5, 0)).toEqual([2026, 5]);
  });

  it("checks day, month and year keys against commissioning and today", () => {
    expect(inRange("2026-11-02", "2023-04-10", "2026-11-02")).toBe(true);
    expect(inRange("2026-11-03", "2023-04-10", "2026-11-02")).toBe(false);
    expect(inRange("2023-04", "2023-04-10", "2026-11-02")).toBe(true); // bulan commissioning boleh
    expect(inRange("2023-03", "2023-04-10", "2026-11-02")).toBe(false);
    expect(inRange("2023", "2023-04-10", "2026-11-02")).toBe(true);
    expect(selectableYears("2023-04-10", "2026-11-02")).toEqual([2026, 2025, 2024, 2023]);
  });
});
