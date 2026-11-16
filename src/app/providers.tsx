import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AlarmRepositoryProvider } from "@/domains/alarm/application/alarm-repository-context";
import { AuthRepositoryProvider } from "@/domains/auth/application/auth-repository-context";
import { DeviceRepositoryProvider } from "@/domains/device/application/device-repository-context";
import { MaintenanceRepositoryProvider } from "@/domains/maintenance/application/maintenance-repository-context";
import { OutageRepositoryProvider } from "@/domains/outage/application/outage-repository-context";
import { PerformanceRepositoryProvider } from "@/domains/performance/application/performance-repository-context";
import { PlantRepositoryProvider } from "@/domains/plant/application/plant-repository-context";
import { ScadaRepositoryProvider } from "@/domains/scada/application/scada-repository-context";
import { TelemetryRepositoryProvider } from "@/domains/telemetry/application/telemetry-repository-context";
import { queryClient } from "@/shared/lib/queryClient";
import type { Repositories } from "./container";

export function AppProviders({ repositories, children }: { repositories: Repositories; children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthRepositoryProvider repository={repositories.auth}>
      <PlantRepositoryProvider repository={repositories.plant}>
        <PerformanceRepositoryProvider repository={repositories.performance}>
          <TelemetryRepositoryProvider repository={repositories.telemetry}>
            <AlarmRepositoryProvider repository={repositories.alarm}>
              <ScadaRepositoryProvider repository={repositories.scada}>
                <DeviceRepositoryProvider repositories={{ devices: repositories.device, telemetry: repositories.deviceTelemetry }}>
                  <MaintenanceRepositoryProvider repository={repositories.maintenance}>
                    <OutageRepositoryProvider repository={repositories.outage}>{children}</OutageRepositoryProvider>
                  </MaintenanceRepositoryProvider>
                </DeviceRepositoryProvider>
              </ScadaRepositoryProvider>
            </AlarmRepositoryProvider>
          </TelemetryRepositoryProvider>
        </PerformanceRepositoryProvider>
      </PlantRepositoryProvider>
      </AuthRepositoryProvider>
    </QueryClientProvider>
  );
}
