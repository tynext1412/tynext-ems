import { createContext, useContext, type ReactNode } from "react";
import type { DeviceRepository, DeviceTelemetryRepository } from "./device-repository";

interface DeviceRepositories {
  devices: DeviceRepository;
  telemetry: DeviceTelemetryRepository;
}

const DeviceRepositoryContext = createContext<DeviceRepositories | null>(null);

export function DeviceRepositoryProvider({ repositories, children }: { repositories: DeviceRepositories; children: ReactNode }) {
  return <DeviceRepositoryContext.Provider value={repositories}>{children}</DeviceRepositoryContext.Provider>;
}

// Provider dan hook sengaja satu file supaya context-nya tetap privat.
// eslint-disable-next-line react-refresh/only-export-components
export function useDeviceRepositories(): DeviceRepositories {
  const repos = useContext(DeviceRepositoryContext);
  if (!repos) throw new Error("DeviceRepositoryProvider belum dipasang di composition root");
  return repos;
}
