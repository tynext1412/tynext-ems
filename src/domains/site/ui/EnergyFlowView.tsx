import { lazy, Suspense, useState, type ReactNode } from "react";
import type { Plant } from "@/domains/plant/domain/plant";
import type { PowerSnapshot } from "@/domains/telemetry/domain/power-snapshot";
import { cn } from "@/shared/lib/cn";
import { useMediaQuery } from "@/shared/lib/useMediaQuery";
import { supportsWebGL } from "@/shared/lib/webgl";
import { ErrorBoundary } from "@/shared/ui/ErrorBoundary";
import { Skeleton } from "@/shared/ui/Skeleton";
import { EnergyFlowDiagram } from "./EnergyFlowDiagram";

// three.js dimuat terpisah; halaman lain tidak membayar ukurannya.
const EnergyFlow3D = lazy(() => import("./flow3d/EnergyFlow3D"));

type Mode = "3d" | "2d";
const STORAGE_KEY = "tynext-ems.flow-view";
const OVERLAY_INSET_PX = 192 + 32; // lebar kotak angka (w-48) + margin kanan

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
  stats?: ReactNode; // kotak angka harian: menumpang di kanan adegan 3D (layar lebar), di bawah untuk 2D/ponsel
}

// Diagram aliran energi: adegan 3D sesuai jenis site, dengan versi 2D (SVG) sebagai
// pilihan dan sebagai cadangan bila WebGL tidak ada atau adegan gagal dirender.
export function EnergyFlowView({ plant, snapshot, stats }: Props) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [failed, setFailed] = useState(false);
  const wide = useMediaQuery("(min-width: 768px)");
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
  const overlayStats = show3d && wide;
  const fallback = <EnergyFlowDiagram snapshot={snapshot} hasBattery={hasBattery} />;

  return (
    <div className="grid gap-3">
      <div className="relative">
        {show3d ? (
          <ErrorBoundary fallback={fallback} onError={() => setFailed(true)}>
            <Suspense fallback={<Skeleton className="h-80 w-full rounded-md md:h-[26rem]" />}>
              <EnergyFlow3D snapshot={snapshot} hasBattery={hasBattery} batteryUnits={batteryUnits} plantType={plant.plantType} overlay={overlayStats ? stats : undefined} insetRight={overlayStats ? OVERLAY_INSET_PX : 0} />
            </Suspense>
          </ErrorBoundary>
        ) : (
          fallback
        )}
        <div role="group" aria-label="Tampilan diagram" title={failed ? "Adegan 3D gagal dirender" : !webgl ? "WebGL tidak tersedia" : undefined} className="absolute bottom-3 right-3 z-30 flex rounded-md border border-border bg-surface p-0.5">
          {(["3d", "2d"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              disabled={m === "3d" && (!webgl || failed)}
              onClick={() => choose(m)}
              className={cn("h-7 rounded-sm px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50", mode === m ? "bg-accent-soft text-ink" : "text-muted hover:text-text")}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {stats && !overlayStats && <div className="grid gap-3 sm:grid-cols-3">{stats}</div>}
    </div>
  );
}
