import { describe, expect, it } from "vitest";
import { matchesPlantSearch, searchPlants } from "./search";

const plant = (name: string, owner: string, address = "Siak, Riau", id = "PLT-001") => ({ id, name, owner: { name: owner }, location: { address, point: { lat: 0, lng: 0 }, timezone: "Asia/Jakarta" } });

describe("matchesPlantSearch", () => {
  it("matches plant name, owner name, address, and id regardless of case", () => {
    const p = plant("Pabrik Sawit Siak", "PT Siak Agro Lestari");
    expect(matchesPlantSearch(p, "sawit")).toBe(true);
    expect(matchesPlantSearch(p, "AGRO lestari")).toBe(true);
    expect(matchesPlantSearch(p, "riau")).toBe(true);
    expect(matchesPlantSearch(p, "plt-001")).toBe(true);
    expect(matchesPlantSearch(p, "bali")).toBe(false);
  });

  it("treats blank search as match-all and sorts results by name", () => {
    const list = [plant("Zeta", "A"), plant("Alpha", "B")];
    expect(matchesPlantSearch(list[0], "   ")).toBe(true);
    expect(searchPlants(list, "").map((p) => p.name)).toEqual(["Alpha", "Zeta"]);
  });
});
