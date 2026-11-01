import { describe, expect, it } from "vitest";
import { plantFixtures } from "../infrastructure/fixtures";
import { applyInfo, infoOf, parseCoordinate, validateInfo } from "./plant-info";
import type { Plant } from "./plant";

const plant: Plant = { ...plantFixtures[0], status: "ONLINE" };

describe("plant info editing", () => {
  it("round-trips the editable fields and trims text", () => {
    const info = infoOf(plant);
    expect(validateInfo(info)).toEqual({});
    const next = applyInfo(plant, { ...info, name: "  Plant Baru  ", organization: "   ", lat: -1.5, lng: 110.25, timezone: "Asia/Makassar" });
    expect(next.name).toBe("Plant Baru");
    expect(next.organization).toBeUndefined();
    expect(next.location).toMatchObject({ point: { lat: -1.5, lng: 110.25 }, timezone: "Asia/Makassar" });
    expect(next.capacity).toEqual(plant.capacity); // yang tidak bisa diedit tidak berubah
    expect(next.id).toBe(plant.id);
  });

  it("reports missing text, bad coordinates, email and time zone", () => {
    const errors = validateInfo({ ...infoOf(plant), name: " ", address: "", lat: 91, lng: Number.NaN, ownerContactEmail: "bukan-email", timezone: "Europe/Paris", installer: "" });
    expect(Object.keys(errors).sort()).toEqual(["address", "installer", "lat", "lng", "name", "ownerContactEmail", "timezone"]);
    expect(errors.lat).toMatch(/between -90 and 90/);
    expect(errors.lng).toMatch(/Enter a number/);
  });

  it("parses decimal and hemisphere coordinate notations", () => {
    expect(parseCoordinate("-0.0263", "lat")).toBeCloseTo(-0.0263);
    expect(parseCoordinate("0,0263", "lat")).toBeCloseTo(0.0263);
    expect(parseCoordinate("S0.026300", "lat")).toBeCloseTo(-0.0263);
    expect(parseCoordinate("109.3425 E", "lng")).toBeCloseTo(109.3425);
    expect(parseCoordinate("W12.5", "lng")).toBeCloseTo(-12.5);
    expect(parseCoordinate("E10", "lat")).toBeNaN(); // arah salah sumbu
    expect(parseCoordinate("abc", "lat")).toBeNaN();
    expect(parseCoordinate("", "lng")).toBeNaN();
  });
});
