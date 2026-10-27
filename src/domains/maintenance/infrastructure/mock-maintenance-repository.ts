import type { PlantId } from "@/domains/plant/domain/plant";
import { plantFixtures, type PlantFixture } from "@/domains/plant/infrastructure/fixtures";
import { addDays, hashSeed, localMidnightUtc, toDateKey } from "@/shared/domain/time";
import type { MaintenanceRepository, MaintenanceUpdate } from "../application/maintenance-repository";
import { applyPatch, type MaintenanceActivity, type MaintenanceDraft, type MaintenancePhoto } from "../domain/maintenance";

const SIMULATED_LATENCY_MS = 250;
const STORAGE_KEY = "tynext-ems.maintenance.v1";

// Perubahan pengguna disimpan sebagai lapisan di atas seed: seed dibangun ulang relatif
// terhadap hari ini (supaya demo selalu punya Pending/Upcoming), lapisan menempel lewat id.
interface Overlay {
  created: MaintenanceActivity[];
  patched: Record<string, Pick<MaintenanceActivity, "completedAt" | "notes" | "photos" | "updatedAt">>;
}

const REGULAR_TASKS = [
  "Pembersihan modul PV dan pemeriksaan struktur mounting",
  "Inspeksi inverter: filter udara, kipas, torsi terminal DC/AC",
  "Pemeriksaan meter, proteksi grid, dan pembumian",
  "Pengujian baterai: SOC, suhu sel, koneksi BMS",
];

function iso(dateKey: string, tz: string, hour: number): string {
  return new Date(localMidnightUtc(dateKey, tz).getTime() + hour * 3_600_000).toISOString();
}

export function seedMaintenance(fixture: PlantFixture, today: string): MaintenanceActivity[] {
  const tz = fixture.location.timezone;
  const seed = hashSeed(fixture.id);
  const tasks = fixture.capacity.batteryKWh > 0 ? REGULAR_TASKS : REGULAR_TASKS.slice(0, 3);
  const items: MaintenanceActivity[] = [];
  const push = (key: string, date: string, type: MaintenanceActivity["type"], activity: string, done: boolean, notes = "") => {
    if (date < fixture.commissionedAt) return;
    const createdAt = iso(addDays(date, -14), tz, 8);
    const completedAt = done ? iso(date, tz, 9 + (seed % 5)) : null;
    items.push({ id: `${fixture.id}-OM-${key}`, plantId: fixture.id, date, type, activity, notes, photos: [], completedAt, createdAt, updatedAt: completedAt ?? createdAt });
  };

  // Regular bulanan: 3 bulan terakhir selesai, bulan ini pending (sebagian plant), 2 bulan ke depan upcoming.
  const dayOfMonth = (seed % 7) + 1;
  for (let m = 3; m >= 1; m--) {
    const date = addDays(today, -30 * m - dayOfMonth);
    push(`R-${m}`, date, "REGULAR", tasks[(seed + m) % tasks.length], true, m === 1 ? "Semua string normal, tegangan seimbang." : "");
  }
  if (seed % 3 !== 0) push("R-0", addDays(today, -((seed % 5) + 1)), "REGULAR", tasks[seed % tasks.length], false);
  push("R-N1", addDays(today, (seed % 10) + 3), "REGULAR", tasks[(seed + 1) % tasks.length], false);
  push("R-N2", addDays(today, (seed % 10) + 33), "REGULAR", tasks[(seed + 2) % tasks.length], false);

  // Corrective: mengikuti kondisi device di fixture supaya konsisten dengan halaman Alarm.
  const offline = fixture.devices.find((d) => !d.connected);
  if (offline) push("C-COMM", addDays(today, -2), "CORRECTIVE", `Pemulihan komunikasi ${offline.id} (cek kabel RS485 & catu daya datalogger)`, false);
  const alarmed = fixture.devices.find((d) => d.activeAlarms > 0);
  if (alarmed) push("C-TEMP", today, "CORRECTIVE", `Penanganan alarm suhu ${alarmed.id}: bersihkan heatsink, ganti kipas bila perlu`, false);
  if (seed % 2 === 0) push("C-1", addDays(today, -45 - (seed % 20)), "CORRECTIVE", "Penggantian fuse string PV2 pada inverter 3", true, "Fuse 15 A diganti, string kembali produksi.");

  return items;
}

export class MockMaintenanceRepository implements MaintenanceRepository {
  private readonly fixtures: Map<PlantId, PlantFixture>;
  private overlay: Overlay = { created: [], patched: {} };

  constructor(
    fixtures: PlantFixture[] = plantFixtures,
    private readonly now: () => Date = () => new Date(),
    private readonly storage: Storage | null = typeof localStorage === "undefined" ? null : localStorage,
  ) {
    this.fixtures = new Map(fixtures.map((f) => [f.id, f]));
    this.load();
  }

  async findByPlant(plantId: PlantId): Promise<MaintenanceActivity[]> {
    await delay();
    return this.listFor(plantId);
  }

  async create(plantId: PlantId, draft: MaintenanceDraft): Promise<MaintenanceActivity> {
    await delay();
    if (!this.fixtures.has(plantId)) throw new Error(`Plant ${plantId} tidak dikenal`);
    const nowIso = this.now().toISOString();
    const activity: MaintenanceActivity = {
      id: `${plantId}-OM-U-${this.now().getTime().toString(36)}`,
      plantId,
      date: draft.date,
      type: draft.type,
      activity: draft.activity.trim(),
      notes: draft.notes.trim(),
      photos: [],
      completedAt: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.overlay.created.push(activity);
    this.save();
    return { ...activity };
  }

  async update(id: string, patch: MaintenanceUpdate): Promise<MaintenanceActivity> {
    await delay();
    const current = this.find(id);
    if (!current) throw new Error(`Aktivitas ${id} tidak ditemukan`);
    const nowIso = this.now().toISOString();
    const stamp = this.now().getTime().toString(36);
    const addPhotos: MaintenancePhoto[] = (patch.addPhotos ?? []).map((p, i) => ({ id: `${stamp}-${i}`, name: p.name, dataUrl: p.dataUrl, uploadedAt: nowIso }));
    const next = applyPatch(current, { ...patch, addPhotos }, nowIso);

    const createdIndex = this.overlay.created.findIndex((a) => a.id === id);
    if (createdIndex >= 0) this.overlay.created[createdIndex] = next;
    else this.overlay.patched[id] = { completedAt: next.completedAt, notes: next.notes, photos: next.photos, updatedAt: next.updatedAt };
    this.save();
    return { ...next };
  }

  private listFor(plantId: PlantId): MaintenanceActivity[] {
    const fixture = this.fixtures.get(plantId);
    if (!fixture) return [];
    const today = toDateKey(this.now(), fixture.location.timezone);
    const seeded = seedMaintenance(fixture, today).map((a) => ({ ...a, ...this.overlay.patched[a.id] }));
    return [...seeded, ...this.overlay.created.filter((a) => a.plantId === plantId)].map((a) => ({ ...a, photos: [...a.photos] }));
  }

  private find(id: string): MaintenanceActivity | undefined {
    const plantId = [...this.fixtures.keys()].find((pid) => id.startsWith(`${pid}-OM-`));
    return plantId ? this.listFor(plantId).find((a) => a.id === id) : undefined;
  }

  private load() {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Overlay>;
      this.overlay = { created: Array.isArray(parsed.created) ? parsed.created : [], patched: parsed.patched ?? {} };
    } catch {
      this.overlay = { created: [], patched: {} };
    }
  }

  // Simpan sebaik mungkin: foto base64 bisa melampaui kuota localStorage (±5 MB);
  // bila gagal, perubahan tetap hidup di memori sampai halaman dimuat ulang.
  private save() {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.overlay));
    } catch (e) {
      console.warn("Perubahan O&M tidak tersimpan di browser:", e instanceof Error ? e.message : e);
    }
  }
}

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
}
