import { describe, expect, it } from "vitest";
import { HttpAuthRepository } from "@/domains/auth/infrastructure/http-auth-repository";
import { deviceStatus, type DeviceRecord } from "@/domains/device/domain/device";
import { parametersFor } from "@/domains/device/domain/parameters";
import { maintenanceStatus } from "@/domains/maintenance/domain/maintenance";
import { GRANULARITIES, sumEnergyBuckets } from "@/domains/performance/domain/performance";
import { validateTariff, hasTariffErrors } from "@/domains/performance/domain/tariff";
import { derivePlantStatus } from "@/domains/plant/domain/status-policy";
import { batteryStatus } from "@/domains/telemetry/domain/power-snapshot";
import { toDateKey, addDays } from "@/shared/domain/time";
import { ApiClient, readCookie } from "@/shared/lib/apiClient";
import { createHttpRepositories } from "./container";

// Uji adapter terhadap backend asli (repo tynext-mqtt). Dilewati tanpa TYNEXT_API_URL, mis.
//   TYNEXT_API_URL=http://localhost:8090/api/v1 npx vitest run src/app/http-adapters.integration.test.ts
// Akun: TYNEXT_API_EMAIL / TYNEXT_API_PASSWORD (bawaan akun demo stack dev).
const BASE = process.env.TYNEXT_API_URL;
const PASSWORD = process.env.TYNEXT_API_PASSWORD ?? "tynext-demo-2026";

// Node tidak menyimpan cookie: jar kecil untuk cookie sesi + CSRF.
function client(): ApiClient {
  const jar = new Map<string, string>();
  const fetchWithJar: typeof fetch = async (input, init = {}) => {
    const headers = new Headers(init.headers);
    if (jar.size > 0) headers.set("Cookie", [...jar].map(([k, v]) => `${k}=${v}`).join("; "));
    const res = await fetch(input, { ...init, headers });
    for (const c of res.headers.getSetCookie()) {
      const [pair, ...attrs] = c.split(";");
      const [k, ...v] = pair.split("=");
      if (attrs.some((a) => /max-age=-1|max-age=0/i.test(a.trim())) || v.join("=") === "") jar.delete(k.trim());
      else jar.set(k.trim(), v.join("="));
    }
    return res;
  };
  return new ApiClient({
    baseUrl: BASE!,
    fetch: fetchWithJar,
    csrfToken: () => readCookie("tynext_csrf", [...jar].map(([k, v]) => `${k}=${v}`).join("; ")),
  });
}

function isNum(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function expectNumbers(obj: object, keys: readonly string[], where: string) {
  for (const k of keys) expect(isNum((obj as Record<string, unknown>)[k]), `${where}.${k} = ${String((obj as Record<string, unknown>)[k])}`).toBe(true);
}

describe.skipIf(!BASE)("HTTP adapters against the running backend", () => {
  it("serve every port as an admin with data the domain functions accept", { timeout: 120_000 }, async () => {
    const api = client();
    const auth = new HttpAuthRepository(api);
    const r = createHttpRepositories(api);

    expect(await auth.current()).toBeNull();
    const session = await auth.signIn({ email: process.env.TYNEXT_API_EMAIL ?? "admin@tynext.local", password: PASSWORD });
    expect(session.user.role).toMatch(/ADMIN|OPERATOR|VIEWER/);
    expect((await auth.current())?.user.email).toBe(session.user.email);

    const plants = await r.plant.findAll();
    expect(plants.length).toBeGreaterThan(0);
    for (const p of plants) {
      expect(derivePlantStatus(p.devices), `status ${p.id}`).toBe(p.status);
      expectNumbers(p.capacity, ["pvKWp", "inverterKW", "batteryKWh"], `${p.id}.capacity`);
      expect(p.commissionedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    const perf = await r.performance.findAll();
    expect(perf.map((p) => p.plantId).sort()).toEqual(plants.map((p) => p.id).sort());

    // Satu plant terhubung dengan baterai bila ada (paling banyak jenis device).
    const plant = plants.find((p) => p.status !== "OFFLINE" && p.capacity.batteryKWh > 0) ?? plants.find((p) => p.status !== "OFFLINE") ?? plants[0];
    expect((await r.plant.findById(plant.id))?.id).toBe(plant.id);
    expect(await r.plant.findById("PLT-DOES-NOT-EXIST")).toBeNull();
    const weather = await r.plant.weatherReport(plant.id);
    if (weather) expect(weather.forecast).toHaveLength(5);

    const today = toDateKey(new Date(), plant.location.timezone);
    const yesterday = addDays(today, -1);
    for (const granularity of GRANULARITIES) {
      const od = await r.performance.operatingData({ plantId: plant.id, granularity, date: yesterday });
      expectNumbers(od, ["pvProductionKWh", "bessChargeKWh", "bessDischargeKWh", "dieselGeneratorKWh", "loadConsumptionKWh", "dayOperation", "hoursOperation", "revenueIDR"], `operatingData.${granularity}`);
    }
    for (const granularity of ["month", "year", "lifetime"] as const) {
      const buckets = await r.performance.energySeries(plant.id, granularity, today);
      expect(buckets.length).toBeGreaterThan(0);
      expectNumbers(sumEnergyBuckets(buckets), ["pvProductionKWh", "loadKWh"], `energySeries.${granularity}`);
    }
    const tariffs = await r.performance.tariffSeries(plant.id, today);
    expect(tariffs).toHaveLength(25);
    const tariff = await r.performance.purchaseTariff(plant.id);
    if (tariff.baseRateIDRPerKWh > 0) expect(hasTariffErrors(validateTariff(tariff))).toBe(false);

    const latest = await r.telemetry.latest(plant.id);
    if (latest) {
      expectNumbers(latest, ["pvKW", "loadKW", "gensetKW", "batteryKW", "gridKW", "socPercent"], "latest");
      expect(["CHARGING", "DISCHARGING", "IDLE"]).toContain(batteryStatus(latest.batteryKW));
    }
    const daily = await r.telemetry.dailySeries(plant.id, yesterday);
    expect(daily.length).toBeGreaterThan(0);
    expect(daily.length).toBeLessThanOrEqual(288);

    const alarms = await r.alarm.findByPlant(plant.id);
    for (const a of alarms) expect(["INFO", "WARNING", "CRITICAL"]).toContain(a.severity);
    await r.scada.embedFor(plant.id);

    const devices = await r.device.findByPlant(plant.id);
    expect(devices.length).toBeGreaterThan(0);
    const readings = await r.deviceTelemetry.latestForPlant(plant.id);
    const byKind = new Map<string, DeviceRecord>();
    for (const d of devices) {
      deviceStatus(d);
      byKind.set(d.kind === "METER" ? `METER/${d.meterType}` : d.kind, d);
      const reading = readings[d.id];
      if (reading) expect(reading.kind).toBe(d.kind);
    }
    for (const d of byKind.values()) {
      expect((await r.device.findById(d.id))?.id).toBe(d.id);
      const reading = await r.deviceTelemetry.latest(d.id);
      if (reading) expect(reading.deviceId).toBe(d.id);
      const catalog = parametersFor(d);
      const instant = new Set(catalog.filter((p) => p.kind === "instant").map((p) => p.key));
      const energy = new Set(catalog.filter((p) => p.kind === "energy").map((p) => p.key));
      const samples = await r.deviceTelemetry.dailySeries(d.id, yesterday);
      for (const s of samples) for (const k of Object.keys(s.values)) expect(instant.has(k), `${d.id}: kunci ${k} tidak ada di katalog instant`).toBe(true);
      const buckets = await r.deviceTelemetry.energySeries(d.id, "month", today);
      for (const b of buckets) for (const k of Object.keys(b.values)) expect(energy.has(k), `${d.id}: kunci ${k} tidak ada di katalog energy`).toBe(true);
    }
    expect(await r.device.findById("PLT-000-INV-99")).toBeNull();

    const activities = await r.maintenance.findByPlant(plant.id);
    for (const a of activities) maintenanceStatus(a, today);

    await auth.signOut();
    expect(await auth.current()).toBeNull();
  });

  it("lets an admin save Information and Purchase Tariff unchanged and an operator manage O&M", { timeout: 60_000 }, async () => {
    const admin = client();
    await new HttpAuthRepository(admin).signIn({ email: "admin@tynext.local", password: PASSWORD });
    const r = createHttpRepositories(admin);
    const [plant] = await r.plant.findAll();
    const { infoOf } = await import("@/domains/plant/domain/plant-info");
    const saved = await r.plant.updateInfo(plant.id, infoOf(plant));
    expect(saved.name).toBe(plant.name);
    const tariff = await r.performance.purchaseTariff(plant.id);
    if (tariff.baseRateIDRPerKWh > 0) expect(await r.performance.updatePurchaseTariff(plant.id, tariff)).toEqual(tariff);

    const bad = await r.plant.updateInfo(plant.id, { ...infoOf(plant), lat: 120 }).catch((e: unknown) => e);
    expect(bad).toMatchObject({ status: 422, details: { lat: expect.any(String) } });

    const ops = client();
    await new HttpAuthRepository(ops).signIn({ email: "operator@tynext.local", password: PASSWORD });
    const m = createHttpRepositories(ops).maintenance;
    const today = toDateKey(new Date(), plant.location.timezone);
    const created = await m.create(plant.id, { date: today, type: "REGULAR", activity: "Adapter integration test", notes: "" });
    // PNG 1×1 sebagai data URL, seperti hasil compressImage di browser.
    const png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";
    const withPhoto = await m.update(created.id, { notes: "Checked", addPhotos: [{ name: "site.png", dataUrl: png }] });
    expect(withPhoto.notes).toBe("Checked");
    expect(withPhoto.photos).toHaveLength(1);
    const done = await m.update(created.id, { completedAt: new Date().toISOString(), removePhotoIds: [withPhoto.photos[0].id] });
    expect(done.completedAt).not.toBeNull();
    expect(done.photos).toHaveLength(0);

    const viewer = client();
    await new HttpAuthRepository(viewer).signIn({ email: "viewer@tynext.local", password: PASSWORD });
    const denied = await createHttpRepositories(viewer).maintenance.create(plant.id, { date: today, type: "REGULAR", activity: "x", notes: "" }).catch((e: unknown) => e);
    expect(denied).toMatchObject({ status: 403 });
  });
});
