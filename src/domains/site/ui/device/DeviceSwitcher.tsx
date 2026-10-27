import { ArrowLeft, ArrowLeftRight, BatteryCharging, ChevronDown, Gauge, Search, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { usePlantDevices } from "@/domains/device/application/use-devices";
import { DEVICE_KIND_LABEL, deviceStatus, type DeviceKind, type DeviceStatus } from "@/domains/device/domain/device";
import { sameKindDevices } from "@/domains/device/domain/device-list";
import { MasterChip } from "@/domains/device/ui/MasterChip";
import type { Plant } from "@/domains/plant/domain/plant";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Skeleton } from "@/shared/ui/Skeleton";

interface Props {
  plant: Plant;
  kind?: DeviceKind; // belum diketahui selama perangkat aktif masih dimuat
  backTo: string;
}

const ICON: Record<DeviceKind, typeof Zap> = { INVERTER: Zap, BATTERY: BatteryCharging, PCS: ArrowLeftRight, METER: Gauge };
const DOT: Record<DeviceStatus, string> = { ONLINE: "bg-ok", ALARM: "bg-warn", OFFLINE: "bg-danger" };

// Daftar perangkat sejenis di samping detail (semua inverter, atau semua baterai, atau semua
// meter) supaya pindah perangkat tidak perlu kembali ke daftar. Perangkat tidak saling
// terhubung, jadi tidak ada hierarki. Keadaan aktif/hover sama dengan menu site.
export function DeviceSwitcher({ plant, kind, backTo }: Props) {
  const devices = usePlantDevices(plant.id);
  const [search, setSearch] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = useMemo(() => (kind ? sameKindDevices(devices.data ?? [], kind, search) : []), [devices.data, kind, search]);
  const total = kind ? (devices.data ?? []).filter((d) => d.kind === kind).length : 0;
  const loading = devices.isPending || !kind;

  return (
    <aside className="panel-metal rounded-lg md:sticky md:top-0 md:max-h-[calc(100dvh-6rem)] md:overflow-y-auto" aria-label="Perangkat sejenis">
      <div className="flex items-center justify-between gap-2 px-3 pt-2">
        {/* Relatif terhadap rute: dari device/:deviceId, ".." = /plants/:plantId */}
        <Link to={backTo} className="inline-flex h-9 items-center gap-2 text-sm font-medium text-muted hover:text-text">
          <ArrowLeft className="size-4" aria-hidden />
          Device Details
        </Link>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1 rounded-md px-2 text-xs text-muted hover:bg-surface-2 hover:text-text md:hidden"
          aria-expanded={mobileOpen}
          aria-controls="device-switcher-body"
          onClick={() => setMobileOpen((o) => !o)}
        >
          {kind ? `${DEVICE_KIND_LABEL[kind]} lain` : "Perangkat lain"}
          {total > 0 && <span className="font-mono">({total})</span>}
          <ChevronDown className={cn("size-4 transition-transform", mobileOpen && "rotate-180")} aria-hidden />
        </button>
      </div>

      <div id="device-switcher-body" className={cn("px-3 pb-3", mobileOpen ? "block" : "hidden md:block")}>
        <label className="mt-2 block">
          <span className="sr-only">Search Name</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input className="h-9 w-full pl-8 text-sm" placeholder="Search Name…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </label>

        {kind && !devices.isPending && (
          <p className="mt-3 flex items-baseline justify-between px-1 text-xs text-muted">
            <span className="font-medium uppercase tracking-wide">{DEVICE_KIND_LABEL[kind]}</span>
            <span className="font-mono">
              {search.trim() ? `${items.length}/${total}` : total} unit
            </span>
          </p>
        )}

        {loading && !devices.error && (
          <div className="mt-3 grid gap-2" aria-busy>
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-3/4" />
            <span className="sr-only">Memuat daftar perangkat…</span>
          </div>
        )}
        {devices.error && (
          <div className="mt-3">
            <p role="alert" className="mb-2 text-xs">
              Daftar perangkat tidak bisa dimuat.
            </p>
            <Button className="h-9" onClick={() => void devices.refetch()}>
              Coba muat ulang
            </Button>
          </div>
        )}
        {!loading && items.length === 0 && <p className="mt-3 text-xs text-muted">Tidak ada perangkat yang cocok dengan “{search.trim()}”.</p>}
        {!loading && items.length > 0 && (
          <ul className="mt-1 grid gap-0.5 text-sm">
            {items.map((d) => {
              const Icon = ICON[d.kind];
              const status = deviceStatus(d);
              return (
                <li key={d.id}>
                  <NavLink
                    to={`/plants/${plant.id}/device/${d.id}`}
                    end
                    title={d.serialNumber}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex h-10 min-w-0 items-center gap-2 rounded-md px-2.5 transition-colors duration-150 hover:bg-accent-soft hover:text-ink hover:font-semibold focus-visible:bg-accent-soft focus-visible:text-ink",
                        isActive
                          ? "bg-accent/10 font-semibold text-accent before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-full before:bg-accent"
                          : "text-text",
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0 text-muted group-hover:text-ink" aria-hidden />
                    <span className="truncate">{d.name}</span>
                    {d.kind === "INVERTER" && d.isMaster && <MasterChip className="group-hover:bg-ink/15 group-hover:text-ink" />}
                    <span className={cn("ml-auto size-2 shrink-0 rounded-full group-hover:ring-2 group-hover:ring-ink/30", DOT[status])} role="img" aria-label={`Status ${status.toLowerCase()}`} />
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
