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
export const NOTES_MAX_LENGTH = 2000;
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function validateDraft(d: MaintenanceDraft): MaintenanceDraftErrors {
  const errors: MaintenanceDraftErrors = {};
  if (!DATE_KEY.test(d.date) || Number.isNaN(Date.parse(d.date))) errors.date = "Tanggal harus diisi.";
  if (!MAINTENANCE_TYPES.includes(d.type)) errors.type = "Tipe tidak dikenal.";
  const activity = d.activity.trim();
  if (activity.length === 0) errors.activity = "Aktivitas harus diisi.";
  else if (activity.length > ACTIVITY_MAX_LENGTH) errors.activity = `Maksimal ${ACTIVITY_MAX_LENGTH} karakter.`;
  if (d.notes.length > NOTES_MAX_LENGTH) errors.notes = `Maksimal ${NOTES_MAX_LENGTH} karakter.`;
  return errors;
}

export function isDraftValid(d: MaintenanceDraft): boolean {
  return Object.keys(validateDraft(d)).length === 0;
}

export interface MaintenancePhotoInput {
  name: string;
  dataUrl: string;
}

// Perubahan dari panel detail: tandai selesai/batal, catatan, tambah/hapus foto.
export interface MaintenancePatch {
  completedAt?: string | null;
  notes?: string;
  addPhotos?: MaintenancePhoto[];
  removePhotoIds?: string[];
}

export function applyPatch(a: MaintenanceActivity, patch: MaintenancePatch, now: string): MaintenanceActivity {
  const removed = new Set(patch.removePhotoIds ?? []);
  return {
    ...a,
    completedAt: patch.completedAt !== undefined ? patch.completedAt : a.completedAt,
    notes: patch.notes !== undefined ? patch.notes.slice(0, NOTES_MAX_LENGTH) : a.notes,
    photos: [...a.photos.filter((p) => !removed.has(p.id)), ...(patch.addPhotos ?? [])],
    updatedAt: now,
  };
}

export interface MaintenanceQuery {
  type: MaintenanceType | "ALL";
  status: MaintenanceStatus | "ALL";
  page: number;
  pageSize: number;
}

export const DEFAULT_MAINTENANCE_QUERY: MaintenanceQuery = { type: "ALL", status: "ALL", page: 1, pageSize: 10 };

export interface MaintenanceQueryResult {
  rows: MaintenanceActivity[];
  total: number;
  page: number;
  counts: Record<MaintenanceStatus, number>; // per status, setelah filter tipe
}

// Urutan: tanggal terbaru dulu (jadwal mendatang di atas), lalu yang terakhir dibuat.
export function applyMaintenanceQuery(items: readonly MaintenanceActivity[], q: MaintenanceQuery, today: string): MaintenanceQueryResult {
  const ofType = q.type === "ALL" ? items : items.filter((i) => i.type === q.type);
  const counts: Record<MaintenanceStatus, number> = { DONE: 0, PENDING: 0, UPCOMING: 0 };
  for (const i of ofType) counts[maintenanceStatus(i, today)] += 1;
  const filtered = q.status === "ALL" ? ofType : ofType.filter((i) => maintenanceStatus(i, today) === q.status);
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
  const pages = Math.max(1, Math.ceil(sorted.length / q.pageSize));
  const page = Math.min(Math.max(1, q.page), pages);
  return { rows: sorted.slice((page - 1) * q.pageSize, page * q.pageSize), total: sorted.length, page, counts };
}
