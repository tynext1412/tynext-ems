import type { PlantId } from "@/domains/plant/domain/plant";
import type { MaintenanceActivity, MaintenanceDraft, MaintenancePatch, MaintenancePhotoInput } from "../domain/maintenance";

export interface MaintenanceUpdate extends Omit<MaintenancePatch, "addPhotos"> {
  addPhotos?: MaintenancePhotoInput[]; // id & waktu unggah diberikan oleh repository
}

export interface MaintenanceRepository {
  findByPlant(plantId: PlantId): Promise<MaintenanceActivity[]>;
  create(plantId: PlantId, draft: MaintenanceDraft): Promise<MaintenanceActivity>;
  update(id: string, patch: MaintenanceUpdate): Promise<MaintenanceActivity>;
}
