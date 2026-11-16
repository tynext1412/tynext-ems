import type { PlantId } from "@/domains/plant/domain/plant";
import type { ApiClient } from "@/shared/lib/apiClient";
import { dataUrlToBlob, enc, resolveApiUrl } from "@/shared/lib/http";
import type { MaintenanceRepository, MaintenanceUpdate } from "../application/maintenance-repository";
import type { MaintenanceActivity, MaintenanceDraft, MaintenanceType } from "../domain/maintenance";

// Bentuk kontrak: foto memakai `url` (gambar dilayani backend), domain memakai `dataUrl`.
interface PhotoDto {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

interface ActivityDto {
  id: string;
  plantId: PlantId;
  date: string;
  type: MaintenanceType;
  activity: string;
  notes: string;
  photos: PhotoDto[];
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const PATCH_FIELDS = ["completedAt", "date", "type", "activity", "notes", "removePhotoIds"] as const;

export class HttpMaintenanceRepository implements MaintenanceRepository {
  constructor(private readonly api: ApiClient) {}

  async findByPlant(plantId: PlantId): Promise<MaintenanceActivity[]> {
    const items = await this.api.get<ActivityDto[]>(`/plants/${enc(plantId)}/maintenance`);
    return items.map((a) => this.toDomain(a));
  }

  async create(plantId: PlantId, draft: MaintenanceDraft): Promise<MaintenanceActivity> {
    const body: MaintenanceDraft = { date: draft.date, type: draft.type, activity: draft.activity.trim(), notes: draft.notes.trim() };
    return this.toDomain(await this.api.post<ActivityDto>(`/plants/${enc(plantId)}/maintenance`, body));
  }

  // Field biasa + hapus foto lewat PATCH dulu (supaya batas 10 foto dihitung setelah penghapusan),
  // lalu foto baru diunggah multipart ke /photos. Hasil terakhir dikembalikan.
  async update(id: string, patch: MaintenanceUpdate): Promise<MaintenanceActivity> {
    const body: Record<string, unknown> = {};
    for (const key of PATCH_FIELDS) if (patch[key] !== undefined) body[key] = patch[key];
    const photos = patch.addPhotos ?? [];

    let result: ActivityDto | undefined;
    if (Object.keys(body).length > 0 || photos.length === 0) {
      result = await this.api.patch<ActivityDto>(`/maintenance/${enc(id)}`, body);
    }
    if (photos.length > 0) {
      const form = new FormData();
      for (const p of photos) form.append("files", dataUrlToBlob(p.dataUrl), p.name);
      result = await this.api.upload<ActivityDto>(`/maintenance/${enc(id)}/photos`, form);
    }
    return this.toDomain(result as ActivityDto);
  }

  private toDomain(a: ActivityDto): MaintenanceActivity {
    return {
      id: a.id,
      plantId: a.plantId,
      date: a.date,
      type: a.type,
      activity: a.activity,
      notes: a.notes,
      photos: a.photos.map((p) => ({ id: p.id, name: p.name, dataUrl: resolveApiUrl(p.url, this.api.baseUrl), uploadedAt: p.uploadedAt })),
      completedAt: a.completedAt,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    };
  }
}
