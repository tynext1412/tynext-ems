import { describe, expect, it } from "vitest";
import type { Plant } from "@/domains/plant/domain/plant";
import type { PlantPerformance } from "@/domains/performance/domain/performance";
import { buildOverview } from "./overview";
import { applyPlantListQuery, buildPlantRows, DEFAULT_PLANT_LIST_QUERY } from "./plant-list";

function plant(partial: Partial<Plant> & Pick<Plant, "id" | "name" | "status">): Plant {
  return {
    plantType: "RESORT_HOTEL",
    location: { point: { lat: 0, lng: 0 }, address: "Jakarta", timezone: "Asia/Jakarta" },
    owner: { id: "OWN", name: "Owner", contactEmail: "owner@example.com" },
    installer: "Tynext",
    capacity: { pvKWp: 100, inverterKW: 80, batteryKWh: 50 },
    moduleCount: 182,
    modulePowerW: 550,
    devices: [],
    commissionedAt: "2024-01-01",
    gridConnectedAt: "2024-01-01",
    platformConnectedAt: "2024-01-04",
    createdAt: "2023-12-11T00:42:13.000Z",
    ...partial,
  };
}

function performance(plantId: string, generationKWh: number, revenueIDR = generationKWh * 1000): PlantPerformance {
  return { plantId, generationKWh, chargeKWh: generationKWh / 4, dischargeKWh: generationKWh / 5, tariffIDRPerKWh: 1000, purchaseTariffIDRPerKWh: 1444.7, revenueIDR };
}

const plants = [
  plant({ id: "PLT-1", name: "Alpha", status: "ONLINE" }),
  plant({ id: "PLT-2", name: "Beta", status: "OFFLINE", capacity: { pvKWp: 200, inverterKW: 150, batteryKWh: 0 } }),
  plant({ id: "PLT-3", name: "Gamma", status: "ALARM", location: { point: { lat: 0, lng: 0 }, address: "Surabaya", timezone: "Asia/Jakarta" } }),
];
const performances = [performance("PLT-1", 1000), performance("PLT-2", 500)];

describe("buildOverview", () => {
  it("aggregates sites, capacity, energy and revenue", () => {
    const overview = buildOverview(plants, performances);

    expect(overview.summary).toEqual({
      totalSites: 3,
      activeSites: 2,
      pvCapacityKWp: 400,
      bessCapacityKWh: 100,
      generationKWh: 1500,
      revenueIDR: 1_500_000,
    });
    expect(overview.bess).toEqual({ chargeKWh: 375, dischargeKWh: 300 });
    expect(overview.statusCount).toEqual({ ONLINE: 1, ALARM: 1, OFFLINE: 1 });
  });
});

describe("applyPlantListQuery", () => {
  const rows = buildPlantRows(plants, performances);

  it("fills missing performance with zeros", () => {
    expect(rows[2].performance.generationKWh).toBe(0);
  });

  it("filters by status and search", () => {
    expect(applyPlantListQuery(rows, { ...DEFAULT_PLANT_LIST_QUERY, status: "ALARM" }).items.map((r) => r.plant.id)).toEqual(["PLT-3"]);
    expect(applyPlantListQuery(rows, { ...DEFAULT_PLANT_LIST_QUERY, search: "surabaya" }).items.map((r) => r.plant.id)).toEqual(["PLT-3"]);
    expect(applyPlantListQuery(rows, { ...DEFAULT_PLANT_LIST_QUERY, search: "plt-2" }).totalItems).toBe(1);
  });

  it("sorts by generation descending", () => {
    const page = applyPlantListQuery(rows, { ...DEFAULT_PLANT_LIST_QUERY, sortBy: "generation", order: "desc" });
    expect(page.items.map((r) => r.plant.id)).toEqual(["PLT-1", "PLT-2", "PLT-3"]);
  });

  it("paginates and clamps the page number", () => {
    const page2 = applyPlantListQuery(rows, { ...DEFAULT_PLANT_LIST_QUERY, pageSize: 2, page: 2 });
    expect(page2.items).toHaveLength(1);
    expect(page2.totalPages).toBe(2);

    const clamped = applyPlantListQuery(rows, { ...DEFAULT_PLANT_LIST_QUERY, pageSize: 2, page: 9 });
    expect(clamped.page).toBe(2);
  });
});
