import { Factory } from "lucide-react";
import noPhotoIllustration from "@/assets/figma/illustrations/illustration-no-plant-photo.png";
import type { ReactNode } from "react";
import type { Plant } from "@/domains/plant/domain/plant";
import { formatKWp } from "@/shared/domain/units";
import { CopyButton } from "@/shared/ui/CopyButton";
import { Card, Panel } from "@/shared/ui/Panel";

// Panel Plant Information: tempat foto (belum ada) + ringkasan identitas; panah ke halaman Information.
export function PlantInfoCard({ plant }: { plant: Plant }) {
  const { lat, lng } = plant.location.point;
  const coords = `${lat < 0 ? "S" : "N"}${Math.abs(lat).toFixed(6)}, ${lng < 0 ? "W" : "E"}${Math.abs(lng).toFixed(6)}`;
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <Panel
      icon={<Factory />}
      title="Plant Information"
      cards
    >
      {/* Foto plant belum ada (Figma: kartu 184 px, ilustrasi 150×96 di atas 16 px, teks di 124 px). */}
      <Card className="relative h-[184px] p-0 text-center">
        <img src={noPhotoIllustration} alt="" className="absolute left-1/2 top-4 h-24 w-[150px] -translate-x-1/2" />
        <div className="absolute inset-x-4 top-[124px]">
          <div className="text-sm font-medium leading-6 text-text">No plant photo yet</div>
          <div className="text-xs leading-5 text-muted">Site photo will show here once it is uploaded</div>
        </div>
      </Card>

      <Card className="py-1.5">
        <dl className="divide-y divide-border">
          <Row label="Plant Name">{plant.name}</Row>
          <Row label="Owner">{plant.owner.name}</Row>
          <Row label="PV Capacity">
            <span className="font-mono">{formatKWp(plant.capacity.pvKWp, 1)}</span>
          </Row>
          <Row label="Address">{plant.location.address}</Row>
          <Row label="Coordinates">
            <span className="flex items-center gap-1">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="font-mono text-brand hover:underline" title="Open in Google Maps">
                {coords}
              </a>
              <CopyButton value={coords} label="coordinates" className="size-5" />
            </span>
          </Row>
        </dl>
      </Card>
    </Panel>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-xs">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-text" title={typeof children === "string" ? children : undefined}>
        {children}
      </dd>
    </div>
  );
}
