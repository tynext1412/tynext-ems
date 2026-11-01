import { describe, expect, it } from "vitest";
import { daypartAt } from "./daypart";

const at = (hour: number, minute = 0) => new Date(2026, 10, 1, hour, minute);

describe("daypartAt", () => {
  it("is day from 06:00 up to but not including 18:00", () => {
    expect(daypartAt(at(6))).toBe("day");
    expect(daypartAt(at(12, 30))).toBe("day");
    expect(daypartAt(at(17, 59))).toBe("day");
  });

  it("is night from 18:00 up to but not including 06:00", () => {
    expect(daypartAt(at(18))).toBe("night");
    expect(daypartAt(at(23, 59))).toBe("night");
    expect(daypartAt(at(0))).toBe("night");
    expect(daypartAt(at(5, 59))).toBe("night");
  });
});
