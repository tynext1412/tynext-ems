import type { PlantId } from "@/domains/plant/domain/plant";
import { plantFixtures, type PlantFixture } from "@/domains/plant/infrastructure/fixtures";
import { hashSeed } from "@/shared/domain/time";
import type { AlarmRepository } from "../application/alarm-repository";
import type { Alarm } from "../domain/alarm";

const SIMULATED_LATENCY_MS = 300;
const HOUR_MS = 3_600_000;

// Alarm dummy diturunkan dari kondisi device di fixture supaya konsisten dengan
// status plant: device terputus → COMM_LOSS aktif; activeAlarms > 0 → alarm
// operasional aktif. Riwayat yang sudah clear ditambahkan deterministik.
export class MockAlarmRepository implements AlarmRepository {
  private readonly fixtures: Map<PlantId, PlantFixture>;

  constructor(
    fixtures: PlantFixture[] = plantFixtures,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.fixtures = new Map(fixtures.map((f) => [f.id, f]));
  }

  async findByPlant(plantId: PlantId): Promise<Alarm[]> {
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
    const fixture = this.fixtures.get(plantId);
    if (!fixture) return [];

    const now = this.now().getTime();
    const alarms: Alarm[] = [];

    for (const device of fixture.devices) {
      const seed = hashSeed(`${device.id}`);
      if (!device.connected) {
        alarms.push({
          id: `${device.id}-COMM`,
          plantId,
          deviceId: device.id,
          code: "COMM_LOSS",
          severity: "CRITICAL",
          message: "Tidak ada data dari device lebih dari 3 interval polling",
          raisedAt: new Date(now - (2 + (seed % 20)) * HOUR_MS).toISOString(),
        });
      }
      for (let i = 0; i < device.activeAlarms; i++) {
        alarms.push({
          id: `${device.id}-OT-${i + 1}`,
          plantId,
          deviceId: device.id,
          code: "INV_OVER_TEMP",
          severity: "WARNING",
          message: "Suhu internal inverter di atas 65 °C, daya diturunkan otomatis",
          raisedAt: new Date(now - (1 + ((seed >>> 3) % 6)) * HOUR_MS).toISOString(),
        });
      }
    }

    // Riwayat: dua alarm yang sudah clear dalam 7 hari terakhir.
    const first = fixture.devices[0];
    if (first) {
      const seed = hashSeed(`${plantId}:history`);
      const raised1 = now - (24 + (seed % 72)) * HOUR_MS;
      const raised2 = now - (96 + ((seed >>> 4) % 72)) * HOUR_MS;
      alarms.push(
        {
          id: `${plantId}-H1`,
          plantId,
          deviceId: first.id,
          code: "GRID_UNDER_VOLT",
          severity: "WARNING",
          message: "Tegangan grid di bawah 198 V selama 15 detik",
          raisedAt: new Date(raised1).toISOString(),
          clearedAt: new Date(raised1 + 25 * 60_000).toISOString(),
        },
        {
          id: `${plantId}-H2`,
          plantId,
          deviceId: `${plantId}-LOG-01`,
          code: "LOGGER_RESTART",
          severity: "INFO",
          message: "Data logger restart setelah pembaruan firmware",
          raisedAt: new Date(raised2).toISOString(),
          clearedAt: new Date(raised2 + 4 * 60_000).toISOString(),
        },
      );
    }

    return alarms;
  }
}
