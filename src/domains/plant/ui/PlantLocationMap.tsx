import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import { cn } from "@/shared/lib/cn";
import type { Plant } from "../domain/plant";
import { IMAGERY_ATTRIBUTION, IMAGERY_URL } from "./map-tiles";
import { STATUS_COLOR } from "./status-color";

interface Props {
  plant: Plant;
  className?: string;
}

// Citra satelit lokasi plant dari koordinat GPS; warna asli (tanpa filter grafit)
// karena di sini citranya adalah informasi, bukan latar.
export function PlantLocationMap({ plant, className }: Props) {
  const { lat, lng } = plant.location.point;
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
      className={cn("map-natural h-56 w-full rounded-md", className)}
    >
      <TileLayer url={IMAGERY_URL} attribution={IMAGERY_ATTRIBUTION} />
      <CircleMarker center={[lat, lng]} radius={8} pathOptions={{ color: "#ffffff", weight: 2, fillColor: STATUS_COLOR[plant.status], fillOpacity: 1 }} />
    </MapContainer>
  );
}
