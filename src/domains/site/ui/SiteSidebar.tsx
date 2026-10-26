import { ArrowLeft } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { Brand } from "@/shared/ui/Brand";

interface Props {
  activeAlarms: number;
  variant: "side" | "strip";
}

const NAV = [
  { to: "", label: "Overview", end: true },
  { to: "scada", label: "SCADA" },
  { to: "info", label: "Info" },
  { to: "device", label: "Device" },
  { to: "alarm", label: "Alarm" },
  { to: "om-schedule", label: "O&M schedule" },
] as const;

// Navigasi halaman site: kolom di desktop, strip horizontal di layar sempit.
export function SiteSidebar({ activeAlarms, variant }: Props) {
  const items = NAV.map((item) => {
    const badge = item.label === "Alarm" && activeAlarms > 0 ? activeAlarms : undefined;
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end={"end" in item ? item.end : false}
        className={({ isActive }) =>
          cn(
            "flex h-11 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition-colors",
            isActive ? "bg-surface-2 font-semibold text-copper" : "text-muted hover:bg-surface-2 hover:text-text",
          )
        }
      >
        {item.label}
        {badge !== undefined && (
          <span className="rounded-sm bg-warn/15 px-1.5 font-mono text-xs text-warn" aria-label={`${badge} alarm aktif`}>
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
      <Link to="/" className="mx-2 flex h-10 items-center gap-2 rounded-md px-2 text-sm text-muted hover:bg-surface-2 hover:text-text">
        <ArrowLeft className="size-4" aria-hidden />
        Dashboard
      </Link>
      <nav aria-label="Menu site" className="mt-3 flex flex-col gap-1 px-2">
        {items}
      </nav>
    </aside>
  );
}
