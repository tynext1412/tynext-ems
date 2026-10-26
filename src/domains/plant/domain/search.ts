import type { Plant } from "./plant";

// Pencarian site: cocok bila nama, alamat, atau ID mengandung kata kunci (tanpa peduli huruf besar).
export function matchesPlantSearch(plant: Pick<Plant, "name" | "id" | "location">, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [plant.name, plant.location.address, plant.id].some((field) => field.toLowerCase().includes(q));
}

export function searchPlants<T extends Pick<Plant, "name" | "id" | "location">>(plants: readonly T[], search: string): T[] {
  return plants.filter((p) => matchesPlantSearch(p, search)).sort((a, b) => a.name.localeCompare(b.name, "id"));
}
