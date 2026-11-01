import { CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import { cn } from "@/shared/lib/cn";
import type { Plant } from "../domain/plant";
import { IMAGERY_ATTRIBUTION, IMAGERY_URL } from "./map-tiles";
import { STATUS_COLOR } from "./status-color";

interface Props {
  plant: Plant;
  className?: string;
}

// Citra satelit lokasi plant dari koordinat GPS (statis: tanpa zoom/geser), warna asli.
// MapContainer hanya membaca center saat mount, jadi key koordinat memasang ulang peta bila lokasi diubah.
export function PlantLocationMap({ plant, className }: Props) {
  const { lat, lng } = plant.location.point;
  return (
    <MapContainer
      key={`${lat},${lng}`}
      center={[lat, lng]}
      zoom={16}
      zoomControl={false}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
      touchZoom={false}
      keyboard={false}
      attributionControl={false}
      className={cn("h-40 w-full rounded-2xl", className)}
    >
      <TileLayer url={IMAGERY_URL} attribution={IMAGERY_ATTRIBUTION} />
      <CircleMarker center={[lat, lng]} radius={8} pathOptions={{ color: "#ffffff", weight: 2, fillColor: STATUS_COLOR[plant.status], fillOpacity: 1 }} />
    </MapContainer>
  );
}
