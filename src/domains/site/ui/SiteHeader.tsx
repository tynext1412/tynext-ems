import { MapPin } from "lucide-react";
import type { Plant } from "@/domains/plant/domain/plant";
import { PlantStatusBadge } from "@/domains/plant/ui/PlantStatusBadge";
import { Skeleton } from "@/shared/ui/Skeleton";
import { SiteSwitcher } from "./SiteSwitcher";

interface Props {
  plant: Plant | null | undefined;
  actionsRef: (el: HTMLDivElement | null) => void; // tempat tombol aksi halaman (mis. Add Activity)
}

// Judul halaman site: nama plant (pemilih site) + chip status, lalu lokasi · ID · owner.
export function SiteHeader({ plant, actionsRef }: Props) {
  return (
    <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        {plant ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <SiteSwitcher current={plant} trailing={<PlantStatusBadge status={plant.status} />} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-6 text-muted">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4 text-brand" aria-hidden />
                {plant.location.address}
              </span>
              <span aria-hidden>•</span>
              <span>
                ID: <span className="font-mono text-text">{plant.id}</span>
              </span>
              <span aria-hidden>•</span>
              <span>{plant.owner.name}</span>
            </p>
          </>
        ) : (
          <>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="mt-2 h-4 w-80" />
          </>
        )}
      </div>
      <div ref={actionsRef} className="flex shrink-0 items-center gap-2 empty:hidden" />
    </header>
  );
}
