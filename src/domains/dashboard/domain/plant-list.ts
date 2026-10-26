import type { Plant, PlantStatus } from "@/domains/plant/domain/plant";
import { matchesPlantSearch } from "@/domains/plant/domain/search";
import { EMPTY_PERFORMANCE, indexByPlant, type PlantPerformance } from "@/domains/performance/domain/performance";

export type StatusFilter = PlantStatus | "ALL";
export type SortKey = "name" | "status" | "generation" | "revenue" | "pvCapacity";
export type SortOrder = "asc" | "desc";

export interface PlantListQuery {
  search: string;
  status: StatusFilter;
  sortBy: SortKey;
  order: SortOrder;
  page: number;
  pageSize: number;
}

export const DEFAULT_PLANT_LIST_QUERY: PlantListQuery = {
  search: "",
  status: "ALL",
  sortBy: "name",
  order: "asc",
  page: 1,
  pageSize: 10,
};

export interface PlantRow {
  plant: Plant;
  performance: PlantPerformance;
}

export interface PlantListPage {
  items: PlantRow[];
  page: number;
  totalItems: number;
  totalPages: number;
}

export function buildPlantRows(plants: readonly Plant[], performances: readonly PlantPerformance[]): PlantRow[] {
  const byPlant = indexByPlant(performances);
  return plants.map((plant) => ({
    plant,
    performance: byPlant.get(plant.id) ?? { plantId: plant.id, ...EMPTY_PERFORMANCE },
  }));
}

const STATUS_RANK: Record<PlantStatus, number> = { ONLINE: 0, ALARM: 1, OFFLINE: 2 };

function compareRows(a: PlantRow, b: PlantRow, key: SortKey): number {
  switch (key) {
    case "status":
      return STATUS_RANK[a.plant.status] - STATUS_RANK[b.plant.status];
    case "generation":
      return a.performance.generationKWh - b.performance.generationKWh;
    case "revenue":
      return a.performance.revenueIDR - b.performance.revenueIDR;
    case "pvCapacity":
      return a.plant.capacity.pvKWp - b.plant.capacity.pvKWp;
    default:
      return a.plant.name.localeCompare(b.plant.name, "id");
  }
}

export function applyPlantListQuery(rows: readonly PlantRow[], query: PlantListQuery): PlantListPage {
  const filtered = rows.filter(
    (row) => (query.status === "ALL" || row.plant.status === query.status) && matchesPlantSearch(row.plant, query.search),
  );

  const direction = query.order === "desc" ? -1 : 1;
  const sorted = [...filtered].sort((a, b) => direction * compareRows(a, b, query.sortBy));

  const pageSize = Math.max(1, query.pageSize);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * pageSize;

  return {
    items: sorted.slice(start, start + pageSize),
    page,
    totalItems: sorted.length,
    totalPages,
  };
}
