import type { Plant } from "./plant";

type Searchable = Pick<Plant, "name" | "id" | "location"> & { owner?: Pick<Plant["owner"], "name"> };

// Pencarian site: cocok bila nama plant, nama owner, alamat, atau ID mengandung kata kunci (tanpa peduli huruf besar).
export function matchesPlantSearch(plant: Searchable, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [plant.name, plant.owner?.name ?? "", plant.location.address, plant.id].some((field) => field.toLowerCase().includes(q));
}

export function searchPlants<T extends Searchable>(plants: readonly T[], search: string): T[] {
  return plants.filter((p) => matchesPlantSearch(p, search)).sort((a, b) => a.name.localeCompare(b.name, "id"));
}
