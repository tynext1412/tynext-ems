import type { LatLngBoundsExpression } from "leaflet";
import { CircleMarker, MapContainer, TileLayer, Tooltip, ZoomControl } from "react-leaflet";
import { cn } from "@/shared/lib/cn";
import { PLANT_STATUS_LABEL, type Plant, type PlantId } from "../domain/plant";
import { IMAGERY_ATTRIBUTION, IMAGERY_URL, REFERENCE_URL } from "./map-tiles";
import { STATUS_COLOR } from "./status-color";

const INDONESIA_BOUNDS: LatLngBoundsExpression = [
  [-11, 94],
  [6.5, 141.5],
];

interface PlantMapProps {
  plants: Plant[];
  onSelect?: (id: PlantId) => void;
  className?: string;
}

export function PlantMap({ plants, onSelect, className }: PlantMapProps) {
  return (
    <MapContainer
      bounds={INDONESIA_BOUNDS}
      zoomControl={false}
      scrollWheelZoom
      minZoom={3}
      maxZoom={12}
      zoomSnap={0.5}
      className={cn("h-full w-full", className)}
    >
      <TileLayer url={IMAGERY_URL} attribution={IMAGERY_ATTRIBUTION} />
      <TileLayer url={REFERENCE_URL} />
      <ZoomControl position="topright" />

      {plants.map((plant) => (
        <CircleMarker
          key={plant.id}
          center={[plant.location.point.lat, plant.location.point.lng]}
          radius={7}
          pathOptions={{ color: "#ffffff", weight: 2, fillColor: STATUS_COLOR[plant.status], fillOpacity: 1 }}
          eventHandlers={onSelect ? { click: () => onSelect(plant.id) } : undefined}
        >
          <Tooltip className="plant-tooltip" direction="top" offset={[0, -8]}>
            <div className="text-sm font-semibold">{plant.name}</div>
            <div className="text-xs text-muted">{plant.location.address}</div>
            <div className="mt-1 font-mono text-xs" style={{ color: STATUS_COLOR[plant.status] }}>
              {PLANT_STATUS_LABEL[plant.status]} · {plant.capacity.pvKWp} kWp
            </div>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
