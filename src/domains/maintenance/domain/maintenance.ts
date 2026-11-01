import type { PlantId } from "@/domains/plant/domain/plant";

export type MaintenanceType = "REGULAR" | "CORRECTIVE";
export const MAINTENANCE_TYPES: readonly MaintenanceType[] = ["REGULAR", "CORRECTIVE"];
export const MAINTENANCE_TYPE_LABEL: Record<MaintenanceType, string> = {
  REGULAR: "Regular Maintenance",
  CORRECTIVE: "Corrective Maintenance",
};

export type MaintenanceStatus = "DONE" | "PENDING" | "UPCOMING";
export const MAINTENANCE_STATUSES: readonly MaintenanceStatus[] = ["DONE", "PENDING", "UPCOMING"];
export const MAINTENANCE_STATUS_LABEL: Record<MaintenanceStatus, string> = {
  DONE: "Done",
  PENDING: "Pending",
  UPCOMING: "Upcoming",
};

export interface MaintenancePhoto {
  id: string;
  name: string;
  dataUrl: string; // gambar terkompresi; adapter HTTP nanti bisa mengganti dengan URL
  uploadedAt: string; // ISO
}

export interface MaintenanceActivity {
  id: string;
  plantId: PlantId;
  date: string; // YYYY-MM-DD, tanggal jadwal dalam zona waktu plant
  type: MaintenanceType;
  activity: string;
  notes: string;
  photos: MaintenancePhoto[];
  completedAt: string | null; // ISO; null = belum ditandai selesai
  createdAt: string;
  updatedAt: string;
}

// Status tidak disimpan: Done bila sudah ditandai selesai; selain itu Upcoming bila
// tanggal jadwal masih di depan, Pending bila sudah tiba atau lewat.
export function maintenanceStatus(a: Pick<MaintenanceActivity, "date" | "completedAt">, today: string): MaintenanceStatus {
  if (a.completedAt) return "DONE";
  return a.date > today ? "UPCOMING" : "PENDING";
}

export interface MaintenanceDraft {
  date: string;
  type: MaintenanceType;
  activity: string;
  notes: string;
}

export type MaintenanceDraftErrors = Partial<Record<keyof MaintenanceDraft, string>>;

export const ACTIVITY_MAX_LENGTH = 200;
export const NOTES_MAX_LENGTH = 500;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function validateDraft(d: MaintenanceDraft): MaintenanceDraftErrors {
  const errors: MaintenanceDraftErrors = {};
  if (!DATE_KEY.test(d.date) || Number.isNaN(Date.parse(d.date))) errors.date = "Date is required.";
  if (!MAINTENANCE_TYPES.includes(d.type)) errors.type = "Unknown type.";
  const activity = d.activity.trim();
  if (activity.length === 0) errors.activity = "Activity is required.";
  else if (activity.length > ACTIVITY_MAX_LENGTH) errors.activity = `Maximum ${ACTIVITY_MAX_LENGTH} characters.`;
  if (d.notes.length > NOTES_MAX_LENGTH) errors.notes = `Maximum ${NOTES_MAX_LENGTH} characters.`;
  return errors;
}

export function isDraftValid(d: MaintenanceDraft): boolean {
  return Object.keys(validateDraft(d)).length === 0;
}

export interface MaintenancePhotoInput {
  name: string;
  dataUrl: string;
}

// Perubahan dari panel detail/edit: tandai selesai/batal, jadwal, tipe, aktivitas, catatan, tambah/hapus foto.
export interface MaintenancePatch {
  completedAt?: string | null;
  date?: string;
  type?: MaintenanceType;
  activity?: string;
  notes?: string;
  addPhotos?: MaintenancePhoto[];
  removePhotoIds?: string[];
}

export function applyPatch(a: MaintenanceActivity, patch: MaintenancePatch, now: string): MaintenanceActivity {
  const removed = new Set(patch.removePhotoIds ?? []);
  return {
    ...a,
    completedAt: patch.completedAt !== undefined ? patch.completedAt : a.completedAt,
    date: patch.date !== undefined && DATE_KEY.test(patch.date) ? patch.date : a.date,
    type: patch.type !== undefined && MAINTENANCE_TYPES.includes(patch.type) ? patch.type : a.type,
    activity: patch.activity !== undefined && patch.activity.trim() ? patch.activity.trim().slice(0, ACTIVITY_MAX_LENGTH) : a.activity,
    notes: patch.notes !== undefined ? patch.notes.slice(0, NOTES_MAX_LENGTH) : a.notes,
    photos: [...a.photos.filter((p) => !removed.has(p.id)), ...(patch.addPhotos ?? [])],
    updatedAt: now,
  };
}

// Pencarian di halaman O&M: cocok bila deskripsi aktivitas atau catatan mengandung kata kunci.
export function matchesMaintenanceSearch(a: Pick<MaintenanceActivity, "activity" | "notes">, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return a.activity.toLowerCase().includes(q) || a.notes.toLowerCase().includes(q);
}

export interface MaintenanceQuery {
  type: MaintenanceType | "ALL";
  status: MaintenanceStatus | "ALL";
  search?: string;
  page: number;
  pageSize: number;
}

export const DEFAULT_MAINTENANCE_QUERY: MaintenanceQuery = { type: "ALL", status: "ALL", search: "", page: 1, pageSize: 10 };

export interface MaintenanceQueryResult {
  rows: MaintenanceActivity[];
  total: number;
  page: number;
  counts: Record<MaintenanceStatus, number>; // per status, setelah filter tipe
}

// Urutan: tanggal terbaru dulu (jadwal mendatang di atas), lalu yang terakhir dibuat.
// Hitungan per status dihitung setelah filter tipe dan pencarian, sebelum filter status.
export function applyMaintenanceQuery(items: readonly MaintenanceActivity[], q: MaintenanceQuery, today: string): MaintenanceQueryResult {
  const ofType = items.filter((i) => (q.type === "ALL" || i.type === q.type) && matchesMaintenanceSearch(i, q.search ?? ""));
  const counts: Record<MaintenanceStatus, number> = { DONE: 0, PENDING: 0, UPCOMING: 0 };
  for (const i of ofType) counts[maintenanceStatus(i, today)] += 1;
  const filtered = q.status === "ALL" ? ofType : ofType.filter((i) => maintenanceStatus(i, today) === q.status);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const pages = Math.max(1, Math.ceil(sorted.length / q.pageSize));
  const page = Math.min(Math.max(1, q.page), pages);
  return { rows: sorted.slice((page - 1) * q.pageSize, page * q.pageSize), total: sorted.length, page, counts };
}

// ── Tampilan kalender ───────────────────────────────────────────────────────

// Aktivitas yang lolos filter tipe dan pencarian (tanpa filter status), untuk kalender tab All.
export function filterMaintenance(items: readonly MaintenanceActivity[], q: Pick<MaintenanceQuery, "type" | "search">): MaintenanceActivity[] {
  return items.filter((i) => (q.type === "ALL" || i.type === q.type) && matchesMaintenanceSearch(i, q.search ?? ""));
}

const STATUS_ORDER: Record<MaintenanceStatus, number> = { PENDING: 0, UPCOMING: 1, DONE: 2 };

// Aktivitas satu bulan ("YYYY-MM") dikelompokkan per tanggal. Dalam satu hari: Pending dulu
// (perlu tindakan), lalu Upcoming, lalu Done; sisanya urut waktu dibuat.
export function activitiesByDate(items: readonly MaintenanceActivity[], month: string, today: string): Map<string, MaintenanceActivity[]> {
  const byDate = new Map<string, MaintenanceActivity[]>();
  for (const a of items) {
    if (a.date.slice(0, 7) !== month) continue;
    byDate.set(a.date, [...(byDate.get(a.date) ?? []), a]);
  }
  for (const list of byDate.values()) {
    list.sort((a, b) => STATUS_ORDER[maintenanceStatus(a, today)] - STATUS_ORDER[maintenanceStatus(b, today)] || a.createdAt.localeCompare(b.createdAt));
  }
  return byDate;
}
