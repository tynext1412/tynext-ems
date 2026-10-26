import { useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { countActive, type Alarm } from "@/domains/alarm/domain/alarm";
import { useAlarms } from "@/domains/alarm/application/use-alarms";
import type { Plant, PlantId } from "@/domains/plant/domain/plant";
import { usePlant } from "@/domains/plant/application/use-plants";
import type { PowerSnapshot } from "@/domains/telemetry/domain/power-snapshot";
import { usePowerSnapshot } from "@/domains/telemetry/application/use-power-snapshot";

export interface SiteContext {
  plantId: PlantId;
  plant: Plant | null | undefined;
  snapshot: PowerSnapshot | null | undefined;
  alarms: Alarm[];
  activeAlarmCount: number;
  isPending: boolean;
  error: Error | null;
  retry: () => void;
}

// Data yang dibagi semua halaman site (header, sidebar, Overview, Alarm).
export function useSite(plantId: PlantId): SiteContext {
  const plantQuery = usePlant(plantId);
  const snapshotQuery = usePowerSnapshot(plantId);
  const alarmsQuery = useAlarms(plantId);

  const retry = useCallback(() => {
    void plantQuery.refetch();
    void snapshotQuery.refetch();
    void alarmsQuery.refetch();
  }, [plantQuery, snapshotQuery, alarmsQuery]);

  const alarms = alarmsQuery.data ?? [];
  return {
    plantId,
    plant: plantQuery.data,
    snapshot: snapshotQuery.data,
    alarms,
    activeAlarmCount: countActive(alarms),
    isPending: plantQuery.isPending,
    error: plantQuery.error,
    retry,
  };
}

export function useSiteContext(): SiteContext {
  return useOutletContext<SiteContext>();
}
