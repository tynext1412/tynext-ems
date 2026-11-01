import { point, type CircleMarker as LeafletCircleMarker, type LatLngBoundsExpression, type LeafletMouseEvent } from "leaflet";
import { Minus, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import { formatNumber } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Spinner } from "@/shared/ui/Spinner";
import { type Plant, type PlantId } from "../domain/plant";
import { IMAGERY_ATTRIBUTION, IMAGERY_URL, REFERENCE_URL } from "./map-tiles";
import { PlantStatusBadge } from "./PlantStatusBadge";
import { STATUS_COLOR } from "./status-color";

const INDONESIA_BOUNDS: LatLngBoundsExpression = [
  [-11, 94],
  [6.5, 141.5],
];
const POPUP_GAP = 6; // jarak kartu ke marker (px)
const MARKER_RADIUS = 9; // radius marker 7 px + garis putih 2 px

// Bila tile pertama-tama gagal beruntun tanpa satu pun yang berhasil, layanan peta dianggap tidak bisa diakses.
const TILE_FAILURES_BEFORE_FALLBACK = 8;

interface PlantMapProps {
  plants: Plant[];
  loading?: boolean;
  onSelect?: (id: PlantId) => void;
  className?: string;
  // Tinggi area atas peta yang tertutup overlay (mis. baris KPI di Home). Kartu hover yang tidak muat
  // di atas marker tanpa masuk ke area ini dibuka di bawah marker.
  popupTopInset?: number;
}

// Buka kartu hover di atas marker; bila puncaknya akan tertutup overlay atas, pindahkan ke bawah marker.
// Diukur setelah render (kartu dirender React ke dalam popup), jadi pergeseran terjadi beberapa frame kemudian.
function openPlantPopup(e: LeafletMouseEvent, topInset: number) {
  const marker = e.target as LeafletCircleMarker;
  const popup = marker.getPopup();
  if (!popup) return;
  popup.options.offset = point(0, -POPUP_GAP);
  popup.getElement()?.classList.remove("plant-popup--below");
  marker.openPopup();
  if (topInset <= 0) return;
  const markerY = e.containerPoint.y;
  let frames = 0;
  const place = () => {
    const el = popup.getElement();
    if (!el || !popup.isOpen()) return;
    const height = el.offsetHeight;
    // Isi kartu dirender React setelah popup terbuka; tunggu beberapa frame sampai tingginya ada.
    if (height < 40 && frames++ < 10) {
      requestAnimationFrame(place);
      return;
    }
    // Leaflet memberi .leaflet-popup margin-bottom 20 px; hitung juga supaya kartu benar-benar di bawah titik.
    const margin = parseFloat(getComputedStyle(el).marginBottom) || 0;
    if (markerY - POPUP_GAP - margin - height >= topInset) return;
    popup.options.offset = point(0, height + margin + MARKER_RADIUS + POPUP_GAP);
    el.classList.add("plant-popup--below");
    popup.update();
  };
  requestAnimationFrame(place);
}

// Peta sebaran site: marker berwarna status, kartu ringkas saat hover, kontrol zoom kanan.
// Saat tile gagal dimuat, area peta diganti fallback + "Reload map"; widget lain tetap dipakai.
export function PlantMap({ plants, loading, onSelect, className, popupTopInset = 0 }: PlantMapProps) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const tiles = useRef({ ok: 0, failed: 0 });

  const onTileError = () => {
    tiles.current.failed += 1;
    if (tiles.current.ok === 0 && tiles.current.failed >= TILE_FAILURES_BEFORE_FALLBACK) setFailed(true);
  };
  const onTileLoad = () => {
    tiles.current.ok += 1;
  };

  const reload = () => {
    setFailed(false);
    tiles.current = { ok: 0, failed: 0 };
    setAttempt((n) => n + 1);
  };

  if (failed) {
    return (
      <div className={cn("grid h-full w-full place-items-center bg-bg", className)}>
        <EmptyState
          illustration="map-error"
          size="lg"
          title="Map couldn't load"
          description="The map service can't be reached right now. KPIs, panels, and the Site List still work."
          action={
            <Button variant="primary" onClick={reload}>
              Reload map
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className={cn("relative h-full w-full", className)}>
      <MapContainer key={attempt} bounds={INDONESIA_BOUNDS} zoomControl={false} scrollWheelZoom minZoom={3} maxZoom={12} zoomSnap={0.5} className="h-full w-full">
        <TileLayer url={IMAGERY_URL} attribution={IMAGERY_ATTRIBUTION} eventHandlers={{ tileerror: onTileError, tileload: onTileLoad }} />
        <TileLayer url={REFERENCE_URL} />
        <ZoomButtons />

        {plants.map((plant) => (
          <CircleMarker
            key={plant.id}
            center={[plant.location.point.lat, plant.location.point.lng]}
            radius={MARKER_RADIUS - 2}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: STATUS_COLOR[plant.status], fillOpacity: 1 }}
            eventHandlers={{
              mouseover: (e) => openPlantPopup(e, popupTopInset),
              click: (e) => openPlantPopup(e, popupTopInset),
            }}
          >
            <Popup className="plant-popup" closeButton={false} autoPan={false} offset={[0, -POPUP_GAP]}>
              <PlantHoverCard plant={plant} onOpen={onSelect} />
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {loading && (
        <div className="absolute inset-0 z-[500] grid place-items-center bg-bg/85" aria-busy>
          <div className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm text-muted shadow-chip">
            <Spinner className="text-brand" />
            Loading map and site locations
          </div>
        </div>
      )}
    </div>
  );
}

// Kontrol zoom + / − di kanan, menggantikan kontrol bawaan Leaflet supaya sesuai desain.
function ZoomButtons() {
  const map = useMap();
  return (
    <div className="absolute right-6 top-[54%] z-[1000] flex flex-col overflow-hidden rounded-lg bg-surface shadow-control" role="group" aria-label="Map zoom">
      <button type="button" onClick={() => map.zoomIn()} aria-label="Zoom in" className="grid size-[34px] place-items-center text-text hover:bg-surface-2">
        <Plus className="size-4" aria-hidden />
      </button>
      <span className="h-px bg-border" aria-hidden />
      <button type="button" onClick={() => map.zoomOut()} aria-label="Zoom out" className="grid size-[34px] place-items-center text-text hover:bg-surface-2">
        <Minus className="size-4" aria-hidden />
      </button>
    </div>
  );
}

// Kartu ringkas site (frame "Plant Hover" di Figma, 280×142): nama/alamat/chip di latar abu-abu,
// kartu putih berisi baris PV Capacity, BESS Capacity, dan tombol View Details.
function PlantHoverCard({ plant, onOpen }: { plant: Plant; onOpen?: (id: PlantId) => void }) {
  return (
    <div className="w-[280px] rounded-[20px] bg-surface-2 p-1 pt-2.5 font-sans text-text shadow-overlay">
      <div className="flex items-start justify-between gap-2 px-2 pb-1">
        <div className="flex min-w-0 items-start gap-1.5">
          <PinIcon className="mt-1 size-6 shrink-0 text-brand" />
          <div className="min-w-0">
            <div className="truncate text-base font-semibold leading-6" title={plant.name}>
              {plant.name}
            </div>
            <div className="truncate text-sm leading-5 text-muted" title={plant.location.address}>
              {plant.location.address}
            </div>
          </div>
        </div>
        <PlantStatusBadge status={plant.status} className="mt-0" />
      </div>
      <div className="rounded-2xl bg-surface px-2 pb-2 pt-1">
        <CapacityRow label="PV Capacity" value={plant.capacity.pvKWp} unit="kWp" />
        <CapacityRow label="BESS Capacity" value={plant.capacity.batteryKWh} unit="kWh" />
        <Button variant="primary" className="mt-1 w-full" onClick={() => onOpen?.(plant.id)}>
          View Details
        </Button>
      </div>
    </div>
  );
}

// Satu baris kapasitas di kartu hover: label kiri, angka + satuan kanan; 0 = belum terpasang.
function CapacityRow({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex h-7 items-center justify-between">
      <span className="text-xs leading-5 text-muted">{label}</span>
      {value > 0 ? (
        <span className="font-mono text-lg font-semibold leading-7">
          {formatNumber(value, 0)} <span className="text-sm font-normal text-muted">{unit}</span>
        </span>
      ) : (
        <span className="text-sm leading-7 text-muted">Not installed</span>
      )}
    </div>
  );
}

// Pin lokasi terisi (ikon "map-pin" di kit HeroUI), diwarnai lewat currentColor.
function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12 2.25a7.5 7.5 0 0 0-7.5 7.5c0 5.4 6.3 11.4 6.9 12a.9.9 0 0 0 1.2 0c.6-.6 6.9-6.6 6.9-12a7.5 7.5 0 0 0-7.5-7.5Zm0 10.5a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
    </svg>
  );
}
