import { describe, expect, it } from "vitest";
import { matchesPlantSearch, searchPlants } from "./search";

const plants = [
  { id: "PLT-008", name: "Site Tambang Samarinda", location: { point: { lat: 0, lng: 0 }, address: "Samarinda, Kalimantan Timur", timezone: "Asia/Makassar" } },
  { id: "PLT-001", name: "Sudamala Seraya Resort", location: { point: { lat: 0, lng: 0 }, address: "Labuan Bajo, NTT", timezone: "Asia/Makassar" } },
  { id: "PLT-013", name: "Pabrik Semen Tuban", location: { point: { lat: 0, lng: 0 }, address: "Tuban, Jawa Timur", timezone: "Asia/Jakarta" } },
];

describe("plant search", () => {
  it("matches name, address, or id regardless of case", () => {
    expect(matchesPlantSearch(plants[0], "samarinda")).toBe(true);
    expect(matchesPlantSearch(plants[1], "labuan")).toBe(true);
    expect(matchesPlantSearch(plants[2], "plt-013")).toBe(true);
    expect(matchesPlantSearch(plants[2], "bali")).toBe(false);
  });

  it("returns everything for an empty query, sorted by name", () => {
    expect(searchPlants(plants, "  ").map((p) => p.id)).toEqual(["PLT-013", "PLT-008", "PLT-001"]);
  });

  it("filters to matching plants", () => {
    expect(searchPlants(plants, "timur").map((p) => p.id)).toEqual(["PLT-013", "PLT-008"]);
  });
});
