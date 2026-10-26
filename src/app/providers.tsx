import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AlarmRepositoryProvider } from "@/domains/alarm/application/alarm-repository-context";
import { PerformanceRepositoryProvider } from "@/domains/performance/application/performance-repository-context";
import { PlantRepositoryProvider } from "@/domains/plant/application/plant-repository-context";
import { TelemetryRepositoryProvider } from "@/domains/telemetry/application/telemetry-repository-context";
import { queryClient } from "@/shared/lib/queryClient";
import type { Repositories } from "./container";

export function AppProviders({ repositories, children }: { repositories: Repositories; children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <PlantRepositoryProvider repository={repositories.plant}>
        <PerformanceRepositoryProvider repository={repositories.performance}>
          <TelemetryRepositoryProvider repository={repositories.telemetry}>
            <AlarmRepositoryProvider repository={repositories.alarm}>{children}</AlarmRepositoryProvider>
          </TelemetryRepositoryProvider>
        </PerformanceRepositoryProvider>
      </PlantRepositoryProvider>
    </QueryClientProvider>
  );
}
