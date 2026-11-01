import { lazy, Suspense, useState } from "react";
import type { Plant } from "@/domains/plant/domain/plant";
import type { PowerSnapshot } from "@/domains/telemetry/domain/power-snapshot";
import { supportsWebGL } from "@/shared/lib/webgl";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { Card } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Tabs } from "@/shared/ui/Tabs";
import { HintChip } from "./charts/ChartChrome";
import { EnergyFlowDiagram } from "./EnergyFlowDiagram";

// three.js dimuat terpisah; halaman lain tidak membayar ukurannya.
const EnergyFlow3D = lazy(() => import("./flow3d/EnergyFlow3D"));

type Mode = "3d" | "2d";
const STORAGE_KEY = "tynext-ems.flow-view";

function initialMode(): Mode {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "2d") return "2d";
  } catch {
    /* penyimpanan browser tidak tersedia */
  }
  return supportsWebGL() ? "3d" : "2d";
}

interface Props {
  plant: Plant;
  snapshot: PowerSnapshot | null | undefined;
}

// Kartu adegan aliran energi: 3D sesuai jenis site (atau diagram 2D), petunjuk di kiri bawah,
// sakelar 3D/2D di kanan bawah. 2D juga jadi cadangan bila WebGL tidak ada atau adegan gagal.
export function EnergyFlowView({ plant, snapshot }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [failed, setFailed] = useState(false);
  const hasBattery = plant.capacity.batteryKWh > 0;
  const batteryUnits = plant.devices.filter((d) => d.type === "BATTERY").length;
  const webgl = supportsWebGL();

  const choose = (next: Mode) => {
    setMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* abaikan */
    }
  };

  const show3d = mode === "3d" && webgl && !failed;
  const fallback = (
    <div className="flex h-full items-center justify-center p-4">
      <EnergyFlowDiagram snapshot={snapshot} hasBattery={hasBattery} className="h-full w-auto max-w-full" />
    </div>
  );

  return (
    <Card className="relative overflow-hidden p-0">
      {/* Rasio kartu adegan mengikuti Figma (788 × 304) supaya proporsinya tetap di layar yang lebih lebar dari 1440 px. */}
      <div className="h-[288px] md:h-auto md:aspect-[788/304]">
        {show3d ? (
          <ErrorBoundary fallback={fallback} onError={() => setFailed(true)}>
            <Suspense fallback={<Skeleton className="h-full w-full rounded-none" />}>
              <EnergyFlow3D snapshot={snapshot} hasBattery={hasBattery} batteryUnits={batteryUnits} plantType={plant.plantType} loadCapacityKW={plant.capacity.inverterKW} weather={plant.weather} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          fallback
        )}
      </div>
      <HintChip className="absolute bottom-3 left-3 z-30">{show3d ? "Drag to rotate • Scroll to zoom" : "Single-line diagram"}</HintChip>
      <div className="absolute bottom-3 right-3 z-30" title={failed ? "The 3D scene failed to render" : !webgl ? "WebGL is not available" : undefined}>
        <Tabs
          variant="segmented"
          size="sm"
          activeShadow="toggle"
          aria-label="Diagram view"
          items={[
            { value: "3d", label: "3D", disabled: !webgl || failed },
            { value: "2d", label: "2D" },
          ]}
          value={show3d ? "3d" : "2d"}
          onChange={choose}
        />
      </div>
    </Card>
  );
}
