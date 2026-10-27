import { ChevronRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { Plant } from "@/domains/plant/domain/plant";
import { PLANT_STATUS_LABEL } from "@/domains/plant/domain/plant";
import { formatKWp } from "@/shared/domain/units";
import { Panel } from "@/shared/ui/Panel";

export function PlantInfoCard({ plant }: { plant: Plant }) {
  const { lat, lng } = plant.location.point;
  const coords = `${lat < 0 ? "S" : "N"}${Math.abs(lat).toFixed(6)}, ${lng < 0 ? "W" : "E"}${Math.abs(lng).toFixed(6)}`;

  return (
    <Panel
      title="Plant Information"
      actions={
        <Link to="info" className="flex h-9 items-center gap-1 text-sm text-muted hover:text-text" aria-label="Buka halaman Info">
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      }
    >
      {/* Foto plant belum ada; tidak diisi gambar stok. Koordinat GPS menumpang di pojok foto. */}
      <div className="relative mb-3 grid h-36 place-items-center rounded-md border border-dashed border-border bg-bg text-xs text-muted">
        Foto plant belum tersedia
        <span className="absolute left-2 top-2 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 font-mono text-[11px] text-text">
          <MapPin className="size-3.5 text-accent" aria-hidden />
          {coords}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-md border border-border bg-bg p-3 text-sm">
        <Item label="Plant Name" value={plant.name} />
        <Item label="Owner" value={plant.owner.name} />
        <Item label="Status" value={PLANT_STATUS_LABEL[plant.status]} />
        <Item label="PV Capacity" value={formatKWp(plant.capacity.pvKWp, 1)} mono />
        <div className="col-span-2">
          <dt className="text-xs text-muted">Plant Address</dt>
          <dd className="mt-0.5">{plant.location.address}</dd>
        </div>
      </dl>
    </Panel>
  );
}

function Item({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={mono ? "mt-0.5 font-mono" : "mt-0.5"}>{value}</dd>
    </div>
  );
}
