import { ArrowLeft, Bell, Info, LayoutGrid, Monitor, Server, Wrench } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/shared/lib/cn";

interface Props {
  activeAlarms: number; // jumlah alarm aktif, dipakai untuk aria-label item Alarm
  variant: "side" | "strip";
}

const NAV = [
  { to: "", label: "Overview", icon: LayoutGrid, end: true },
  { to: "scada", label: "SCADA", icon: Monitor },
  { to: "info", label: "Information", icon: Info },
  { to: "device", label: "Device", icon: Server },
  { to: "alarm", label: "Alarm", icon: Bell },
  { to: "om-schedule", label: "O&M Schedule", icon: Wrench },
] as const;

// Menu halaman site: kolom kiri 260 px di desktop (item aktif = biru merek dengan teks putih),
// strip horizontal di layar sempit.
export function SiteSidebar({ activeAlarms, variant }: Props) {
  const items = NAV.map((item) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={"end" in item ? item.end : false}
        className={({ isActive }) =>
          cn(
            "group flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-[10px] px-2 text-sm font-medium transition-colors",
            isActive ? "bg-brand text-on-brand" : "text-text hover:bg-surface-3",
          )
        }
      >
        {({ isActive }) => (
          <>
            <Icon className={cn("size-4 shrink-0", isActive ? "text-on-brand" : "text-muted group-hover:text-text")} aria-hidden />
            {item.label}
            {item.label === "Alarm" && activeAlarms > 0 && <span className="sr-only">, {activeAlarms} active {activeAlarms === 1 ? "alarm" : "alarms"}</span>}
          </>
        )}
      </NavLink>
    );
  });

  if (variant === "strip") {
    return (
      <nav aria-label="Menu site" className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] md:hidden">
        {items}
      </nav>
    );
  }

  return (
    <aside className="hidden w-[260px] shrink-0 flex-col px-4 pt-4 md:flex">
      <Link to="/" className="flex h-8 items-center gap-2 rounded-[10px] px-2 text-sm text-muted transition-colors hover:text-text">
        <ArrowLeft className="size-4" aria-hidden />
        Back to Home
      </Link>
      <div className="mt-4 h-px bg-separator" aria-hidden />
      <nav aria-label="Menu site" className="mt-[17px] flex flex-col gap-1.5 py-1">
        {items}
      </nav>
    </aside>
  );
}
