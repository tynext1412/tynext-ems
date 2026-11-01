import { describe, expect, it } from "vitest";
import { activitiesByDate, applyMaintenanceQuery, applyPatch, filterMaintenance, maintenanceStatus, matchesMaintenanceSearch, validateDraft, type MaintenanceActivity } from "./maintenance";

const item = (id: string, date: string, extra: Partial<MaintenanceActivity> = {}): MaintenanceActivity => ({
  id,
  plantId: "PLT-1",
  date,
  type: "REGULAR",
  activity: `Aktivitas ${id}`,
  notes: "",
  photos: [],
  completedAt: null,
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
  ...extra,
});

describe("maintenanceStatus", () => {
  it("is Done when completed, Upcoming when the date is ahead, otherwise Pending", () => {
    expect(maintenanceStatus({ date: "2026-11-01", completedAt: "2026-10-27T01:00:00Z" }, "2026-10-27")).toBe("DONE");
    expect(maintenanceStatus({ date: "2026-10-28", completedAt: null }, "2026-10-27")).toBe("UPCOMING");
    expect(maintenanceStatus({ date: "2026-10-27", completedAt: null }, "2026-10-27")).toBe("PENDING");
    expect(maintenanceStatus({ date: "2026-10-01", completedAt: null }, "2026-10-27")).toBe("PENDING");
  });
});

describe("validateDraft", () => {
  it("requires a valid date and a non-empty activity", () => {
    expect(validateDraft({ date: "", type: "REGULAR", activity: "x", notes: "" })).toHaveProperty("date");
    expect(validateDraft({ date: "2026-13-40", type: "REGULAR", activity: "x", notes: "" })).toHaveProperty("date");
    expect(validateDraft({ date: "2026-10-27", type: "REGULAR", activity: "   ", notes: "" })).toHaveProperty("activity");
    expect(validateDraft({ date: "2026-10-27", type: "REGULAR", activity: "a".repeat(201), notes: "" })).toHaveProperty("activity");
    expect(validateDraft({ date: "2026-10-27", type: "CORRECTIVE", activity: "Ganti kipas", notes: "ok" })).toEqual({});
  });
});

describe("applyPatch", () => {
  it("marks done, edits notes, and adds/removes photos without touching other fields", () => {
    const base = item("A", "2026-10-20", { photos: [{ id: "p1", name: "a.jpg", dataUrl: "data:,a", uploadedAt: "x" }] });
    const next = applyPatch(
      base,
      { completedAt: "2026-10-27T02:00:00Z", notes: "selesai", removePhotoIds: ["p1"], addPhotos: [{ id: "p2", name: "b.jpg", dataUrl: "data:,b", uploadedAt: "y" }] },
      "2026-10-27T02:00:00Z",
    );
    expect(next.completedAt).toBe("2026-10-27T02:00:00Z");
    expect(next.notes).toBe("selesai");
    expect(next.photos.map((p) => p.id)).toEqual(["p2"]);
    expect(next.updatedAt).toBe("2026-10-27T02:00:00Z");
    expect(next.activity).toBe(base.activity);
    expect(applyPatch(next, { completedAt: null }, "z").completedAt).toBeNull();
  });

  it("edits schedule, type and activity, ignoring invalid or empty values", () => {
    const base = item("A", "2026-10-20");
    const edited = applyPatch(base, { date: "2026-11-03", type: "CORRECTIVE", activity: "  Ganti kipas  " }, "t");
    expect(edited.date).toBe("2026-11-03");
    expect(edited.type).toBe("CORRECTIVE");
    expect(edited.activity).toBe("Ganti kipas");
    const unchanged = applyPatch(base, { date: "bukan-tanggal", activity: "   " }, "t");
    expect(unchanged.date).toBe("2026-10-20");
    expect(unchanged.activity).toBe(base.activity);
  });
});

describe("matchesMaintenanceSearch", () => {
  it("matches activity text or notes, case-insensitively", () => {
    const a = { activity: "Pembersihan modul PV", notes: "Blok A selesai" };
    expect(matchesMaintenanceSearch(a, "")).toBe(true);
    expect(matchesMaintenanceSearch(a, "modul pv")).toBe(true);
    expect(matchesMaintenanceSearch(a, "blok a")).toBe(true);
    expect(matchesMaintenanceSearch(a, "inverter")).toBe(false);
  });
});

describe("applyMaintenanceQuery", () => {
  const items = [
    item("done", "2026-10-01", { completedAt: "2026-10-01T05:00:00Z" }),
    item("pending", "2026-10-20"),
    item("upcoming", "2026-11-05", { type: "CORRECTIVE" }),
    item("upcoming2", "2026-11-20"),
  ];
  const today = "2026-10-27";

  it("counts per status after the type filter and sorts newest date first", () => {
    const all = applyMaintenanceQuery(items, { type: "ALL", status: "ALL", page: 1, pageSize: 10 }, today);
    expect(all.counts).toEqual({ DONE: 1, PENDING: 1, UPCOMING: 2 });
    expect(all.rows.map((r) => r.id)).toEqual(["upcoming2", "upcoming", "pending", "done"]);
    const corrective = applyMaintenanceQuery(items, { type: "CORRECTIVE", status: "ALL", page: 1, pageSize: 10 }, today);
    expect(corrective.counts).toEqual({ DONE: 0, PENDING: 0, UPCOMING: 1 });
  });

  it("applies the search to counts and rows", () => {
    const r = applyMaintenanceQuery(items, { type: "ALL", status: "ALL", search: "upcoming2", page: 1, pageSize: 10 }, today);
    expect(r.counts).toEqual({ DONE: 0, PENDING: 0, UPCOMING: 1 });
    expect(r.rows.map((x) => x.id)).toEqual(["upcoming2"]);
  });

  it("filters by status and clamps the page", () => {
    const r = applyMaintenanceQuery(items, { type: "ALL", status: "UPCOMING", page: 9, pageSize: 1 }, today);
    expect(r.total).toBe(2);
    expect(r.page).toBe(2);
    expect(r.rows.map((x) => x.id)).toEqual(["upcoming"]);
  });
});

describe("calendar grouping", () => {
  const items = [
    item("A", "2026-11-12", { createdAt: "2026-10-02T00:00:00.000Z" }),
    item("B", "2026-11-12", { completedAt: "2026-11-12T08:00:00Z" }),
    item("C", "2026-11-12", { type: "CORRECTIVE", createdAt: "2026-10-03T00:00:00.000Z" }),
    item("D", "2026-11-30"),
    item("E", "2026-12-01"),
    item("F", "2026-10-31"),
  ];

  it("keeps only the month and orders a day by Pending, Upcoming, then Done", () => {
    const byDate = activitiesByDate(items, "2026-11", "2026-11-20");
    expect([...byDate.keys()].sort()).toEqual(["2026-11-12", "2026-11-30"]);
    expect(byDate.get("2026-11-12")?.map((a) => a.id)).toEqual(["A", "C", "B"]); // A, C pending (urut dibuat), B done
  });

  it("filters by type and search but not by status", () => {
    expect(filterMaintenance(items, { type: "CORRECTIVE", search: "" }).map((a) => a.id)).toEqual(["C"]);
    expect(filterMaintenance(items, { type: "ALL", search: "aktivitas e" }).map((a) => a.id)).toEqual(["E"]);
    expect(filterMaintenance(items, { type: "ALL", search: "" })).toHaveLength(6);
  });
});
