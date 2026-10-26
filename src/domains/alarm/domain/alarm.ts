import type { PlantId } from "@/domains/plant/domain/plant";

export type AlarmSeverity = "INFO" | "WARNING" | "CRITICAL";

export const SEVERITY_LABEL: Record<AlarmSeverity, string> = {
  INFO: "Info",
  WARNING: "Warning",
  CRITICAL: "Critical",
};

export interface Alarm {
  id: string;
  plantId: PlantId;
  deviceId: string;
  code: string;
  severity: AlarmSeverity;
  message: string;
  raisedAt: string; // ISO 8601
  clearedAt?: string; // kosong = masih aktif
}

export function isActive(alarm: Alarm): boolean {
  return !alarm.clearedAt;
}

export function countActive(alarms: readonly Alarm[]): number {
  return alarms.filter(isActive).length;
}

const SEVERITY_RANK: Record<AlarmSeverity, number> = { CRITICAL: 0, WARNING: 1, INFO: 2 };

// Aktif dulu, lalu paling parah, lalu terbaru.
export function sortAlarms(alarms: readonly Alarm[]): Alarm[] {
  return [...alarms].sort((a, b) => {
    const activeDiff = Number(isActive(b)) - Number(isActive(a));
    if (activeDiff !== 0) return activeDiff;
    const sevDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (sevDiff !== 0) return sevDiff;
    return b.raisedAt.localeCompare(a.raisedAt);
  });
}
