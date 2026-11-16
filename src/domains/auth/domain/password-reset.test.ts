import { describe, expect, it } from "vitest";
import { formatCountdown, isPast, sanitizeCode } from "./password-reset";

describe("password reset helpers", () => {
  it("keeps only the first 6 digits of a typed or pasted code", () => {
    expect(sanitizeCode("482 917")).toBe("482917");
    expect(sanitizeCode("48-29-17-55")).toBe("482917");
    expect(sanitizeCode("abc")).toBe("");
  });

  it("formats the resend countdown as m:ss, rounding down and never below zero", () => {
    expect(formatCountdown(59_999)).toBe("0:59");
    expect(formatCountdown(40_100)).toBe("0:40");
    expect(formatCountdown(60_000)).toBe("1:00");
    expect(formatCountdown(-5)).toBe("0:00");
  });

  it("compares ISO timestamps with the current time", () => {
    const now = Date.parse("2026-11-16T01:00:00Z");
    expect(isPast("2026-11-16T00:59:59Z", now)).toBe(true);
    expect(isPast("2026-11-16T01:00:01Z", now)).toBe(false);
  });
});
