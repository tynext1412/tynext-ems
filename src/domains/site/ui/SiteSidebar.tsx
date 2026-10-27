import { ArrowLeft, Bell, Cpu, Info, LayoutDashboard, MonitorCog, Wrench } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { Brand } from "@/shared/ui/Brand";

interface Props {
  activeAlarms: number;
  variant: "side" | "strip";
}

const NAV = [
  { to: "", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "scada", label: "SCADA", icon: MonitorCog },
  { to: "info", label: "Info", icon: Info },
  { to: "device", label: "Device", icon: Cpu },
  { to: "alarm", label: "Alarm", icon: Bell },
  { to: "om-schedule", label: "O&M schedule", icon: Wrench },
] as const;

// Keadaan item: aktif = tint aksen + teks aksen + garis aksen di tepi (kiri di kolom, bawah di strip);
// hover/fokus = blok biru logo (accent-soft) dengan tinta gelap (7,6:1), juga saat item itu sedang aktif.
const ITEM_BASE = "group relative flex h-11 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm transition-colors duration-150";
// Penebalan saat hover hanya di kolom (lebar item tetap); di strip lebar teks ikut berubah dan menggeser item lain.
const ITEM_HOVER: Record<Props["variant"], string> = {
  side: "hover:bg-accent-soft hover:text-ink hover:font-semibold focus-visible:bg-accent-soft focus-visible:text-ink",
  strip: "hover:bg-accent-soft hover:text-ink focus-visible:bg-accent-soft focus-visible:text-ink",
};
const ITEM_ACTIVE: Record<Props["variant"], string> = {
  side: "bg-accent/10 font-semibold text-accent before:absolute before:inset-y-2 before:left-0 before:w-0.75 before:rounded-full before:bg-accent",
  strip: "bg-accent/10 font-semibold text-accent before:absolute before:inset-x-3 before:bottom-0 before:h-0.5 before:rounded-full before:bg-accent",
};

// Navigasi halaman site: kolom di desktop, strip horizontal di layar sempit.
export function SiteSidebar({ activeAlarms, variant }: Props) {
  const items = NAV.map((item) => {
    const badge = item.label === "Alarm" && activeAlarms > 0 ? activeAlarms : undefined;
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={"end" in item ? item.end : false}
        className={({ isActive }) => cn(ITEM_BASE, ITEM_HOVER[variant], isActive ? ITEM_ACTIVE[variant] : "text-muted")}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        {item.label}
        {badge !== undefined && (
          <span className="rounded-sm bg-warn/15 px-1.5 font-mono text-xs text-warn group-hover:bg-ink/15 group-hover:text-ink" aria-label={`${badge} alarm aktif`}>
            {badge}
          </span>
        )}
      </NavLink>
    );
  });

  if (variant === "strip") {
    return (
      <nav aria-label="Menu site" className="flex gap-1 overflow-x-auto border-b border-border px-3 py-2 [scrollbar-width:none] md:hidden">
        {items}
      </nav>
    );
  }

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="px-4 pb-3 pt-5">
        <Brand />
      </div>
      <Link to="/" className="mx-2 flex h-10 items-center gap-2 rounded-md px-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text">
        <ArrowLeft className="size-4" aria-hidden />
        Dashboard
      </Link>
      <nav aria-label="Menu site" className="mt-3 flex flex-col gap-1 px-2">
        {items}
      </nav>
    </aside>
  );
}
