import { ArrowLeft, ArrowLeftRight, BatteryCharging, ChevronDown, CloudSun, Gauge, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { usePlantDevices } from "@/domains/device/application/use-devices";
import { DEVICE_KIND_LABEL, deviceStatus, type DeviceKind, type DeviceStatus } from "@/domains/device/domain/device";
import { sameKindDevices } from "@/domains/device/domain/device-list";
import { MasterChip } from "@/domains/device/ui/MasterChip";
import type { Plant } from "@/domains/plant/domain/plant";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { SearchField } from "@/shared/ui/Input";
import { Skeleton } from "@/shared/ui/Skeleton";

interface Props {
  plant: Plant;
  kind?: DeviceKind; // belum diketahui selama perangkat aktif masih dimuat
  backTo: string;
}

const ICON: Record<DeviceKind, typeof Zap> = { INVERTER: Zap, BATTERY: BatteryCharging, PCS: ArrowLeftRight, METER: Gauge, EMI: CloudSun };
const DOT: Record<DeviceStatus, string> = { ONLINE: "bg-ok", ALARM: "bg-warn", OFFLINE: "bg-danger" };

// Daftar perangkat sejenis di samping detail (semua inverter, atau semua baterai, atau semua
// meter) supaya pindah perangkat tidak perlu kembali ke daftar. Perangkat tidak saling
// terhubung, jadi tidak ada hierarki. Gaya item sama dengan menu site (aktif = biru merek).
export function DeviceSwitcher({ plant, kind, backTo }: Props) {
  const devices = usePlantDevices(plant.id);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = useMemo(() => (kind ? sameKindDevices(devices.data ?? [], kind, search) : []), [devices.data, kind, search]);
  const total = kind ? (devices.data ?? []).filter((d) => d.kind === kind).length : 0;
  const loading = devices.isPending || !kind;

  return (
    <aside className="rounded-[20px] bg-surface-2 p-1.5 md:sticky md:top-0 md:max-h-[calc(100dvh-10rem)] md:overflow-y-auto" aria-label="Devices of the same type">
      <div className="flex items-center justify-between gap-2 px-2 py-1">
        {/* Relatif terhadap rute: dari device/:deviceId, ".." = /plants/:plantId */}
        <Link to={backTo} className="inline-flex h-9 items-center gap-2 text-sm font-medium text-muted hover:text-text">
          <ArrowLeft className="size-4" aria-hidden />
          Device List
        </Link>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1 rounded-xl px-2 text-xs text-muted hover:bg-surface-3 hover:text-text md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="device-switcher-body"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {kind ? `Other ${DEVICE_KIND_LABEL[kind]} devices` : "Other devices"}
          {total > 0 && <span className="font-mono">({total})</span>}
          <ChevronDown className={cn("size-4 transition-transform", mobileOpen && "rotate-180")} aria-hidden />
        </button>
      </div>

      <div id="device-switcher-body" className={cn("rounded-2xl bg-surface p-2", mobileOpen ? "block" : "hidden md:block")}>
        <SearchField value={search} onChange={setSearch} placeholder="Search name or SN" aria-label="Search devices of this type" className="h-9" />

        {kind && !devices.isPending && (
          <p className="mt-3 flex items-baseline justify-between px-2 text-xs text-muted">
            <span className="font-medium uppercase tracking-wide">{DEVICE_KIND_LABEL[kind]}</span>
            <span className="font-mono">{search.trim() ? `${items.length}/${total}` : total} unit</span>
          </p>
        )}

        {loading && !devices.error && (
          <div className="mt-2 grid gap-1.5" aria-busy>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-3/4" />
            <span className="sr-only">Loading device list…</span>
          </div>
        )}
        {devices.error && (
          <div className="mt-3 px-2">
            <p role="alert" className="mb-2 text-xs text-danger-text">
              The device list couldn't load.
            </p>
            <Button size="sm" onClick={() => void devices.refetch()}>
              Retry
            </Button>
          </div>
        )}
        {!loading && items.length === 0 && <p className="mt-3 px-2 text-xs text-muted">No devices match “{search.trim()}”.</p>}
        {!loading && items.length > 0 && (
          <ul className="mt-1.5 grid gap-1 text-sm">
            {items.map((d) => {
              const Icon = ICON[d.kind];
              const status = deviceStatus(d);
              return (
                <li key={d.id}>
                  <NavLink
                    to={`/plants/${plant.id}/device/${d.id}`}
                    end
                    title={d.serialNumber}
                    className={({ isActive }) => cn("group flex h-9 min-w-0 items-center gap-2 rounded-xl px-3 font-medium transition-colors", isActive ? "bg-brand text-on-brand" : "text-text hover:bg-surface-3")}
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={cn("size-4 shrink-0", isActive ? "text-on-brand" : "text-muted group-hover:text-text")} aria-hidden />
                        <span className="truncate">{d.name}</span>
                        {d.kind === "INVERTER" && d.isMaster && <MasterChip className={isActive ? "bg-white/20 text-on-brand" : undefined} />}
                        <span className={cn("ml-auto size-2 shrink-0 rounded-full ring-2 ring-surface", DOT[status])} role="img" aria-label={`Status ${status.toLowerCase()}`} />
                      </>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
