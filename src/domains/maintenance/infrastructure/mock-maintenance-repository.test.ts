import { describe, expect, it } from "vitest";
import { plantFixtures } from "@/domains/plant/infrastructure/fixtures";
import { maintenanceStatus } from "../domain/maintenance";
import { MockMaintenanceRepository, seedMaintenance } from "./mock-maintenance-repository";

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() { return this.map.size; }
  clear() { this.map.clear(); }
  getItem(k: string) { return this.map.get(k) ?? null; }
  key(i: number) { return [...this.map.keys()][i] ?? null; }
  removeItem(k: string) { this.map.delete(k); }
  setItem(k: string, v: string) { this.map.set(k, v); }
}

const today = "2026-10-27";
const now = () => new Date("2026-10-27T03:00:00.000Z");

describe("mock maintenance repository", () => {
  it("seeds done, pending and upcoming work for a plant", () => {
    const items = seedMaintenance(plantFixtures[0], today);
    const statuses = new Set(items.map((i) => maintenanceStatus(i, today)));
    expect(statuses.has("DONE")).toBe(true);
    expect(statuses.has("UPCOMING")).toBe(true);
    expect(items.some((i) => i.type === "CORRECTIVE")).toBe(true); // PLT-001 punya inverter offline
    expect(items.every((i) => i.date >= plantFixtures[0].commissionedAt)).toBe(true);
  });

  it("persists created activities and patches across instances via storage", async () => {
    const storage = new MemoryStorage();
    const repo = new MockMaintenanceRepository(plantFixtures, now, storage);
    const created = await repo.create("PLT-001", { date: "2026-11-02", type: "CORRECTIVE", activity: "Ganti kipas inverter 2", notes: "" });
    const seeded = (await repo.findByPlant("PLT-001")).find((a) => a.id !== created.id)!;
    await repo.update(seeded.id, { completedAt: "2026-10-27T03:00:00.000Z", notes: "ok", addPhotos: [{ name: "a.jpg", dataUrl: "data:,a" }] });

    const again = new MockMaintenanceRepository(plantFixtures, now, storage);
    const list = await again.findByPlant("PLT-001");
    expect(list.find((a) => a.id === created.id)?.activity).toBe("Ganti kipas inverter 2");
    const patched = list.find((a) => a.id === seeded.id)!;
    expect(patched.completedAt).toBe("2026-10-27T03:00:00.000Z");
    expect(patched.notes).toBe("ok");
    expect(patched.photos).toHaveLength(1);
    expect(patched.photos[0].name).toBe("a.jpg");
  });

  it("persists edits to schedule, type and activity of seeded items", async () => {
    const storage = new MemoryStorage();
    const repo = new MockMaintenanceRepository(plantFixtures, now, storage);
    const seeded = (await repo.findByPlant("PLT-001"))[0];
    await repo.update(seeded.id, { date: "2026-12-24", type: "CORRECTIVE", activity: "Penggantian fuse string PV2" });

    const again = new MockMaintenanceRepository(plantFixtures, now, storage);
    const edited = (await again.findByPlant("PLT-001")).find((a) => a.id === seeded.id)!;
    expect(edited.date).toBe("2026-12-24");
    expect(edited.type).toBe("CORRECTIVE");
    expect(edited.activity).toBe("Penggantian fuse string PV2");
    expect(edited.photos).toEqual([]);
  });

  it("rejects unknown plants and ids", async () => {
    const repo = new MockMaintenanceRepository(plantFixtures, now, null);
    await expect(repo.create("PLT-999", { date: "2026-11-02", type: "REGULAR", activity: "x", notes: "" })).rejects.toThrow();
    await expect(repo.update("PLT-001-OM-NOPE", { notes: "x" })).rejects.toThrow();
  });
});
