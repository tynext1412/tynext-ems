import { describe, expect, it } from "vitest";
import { inverterStatusLabel, inverterStatusTone } from "./inverter-status";

describe("inverter status codes", () => {
  it("labels known codes and falls back to the raw code", () => {
    expect(inverterStatusLabel(512)).toBe("On-grid");
    expect(inverterStatusLabel(40960)).toBe("Standby: no irradiation");
    expect(inverterStatusLabel(1234)).toBe("Status 1234");
  });

  it("maps codes to a tone", () => {
    expect(inverterStatusTone(512)).toBe("ok");
    expect(inverterStatusTone(513)).toBe("warn");
    expect(inverterStatusTone(768)).toBe("danger");
    expect(inverterStatusTone(40960)).toBe("neutral");
  });
});
