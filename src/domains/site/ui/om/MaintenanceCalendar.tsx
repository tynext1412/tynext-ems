import { CalendarDays, ChevronLeft, ChevronRight, Plus, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { activitiesByDate, MAINTENANCE_STATUS_LABEL, MAINTENANCE_TYPE_LABEL, maintenanceStatus, type MaintenanceActivity, type MaintenanceStatus } from "@/domains/maintenance/domain/maintenance";
import { parseDateKey } from "@/shared/domain/time";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { calendarWeeks, shiftMonth } from "../../domain/period";
import { formatScheduleDate } from "./om-format";

interface Props {
  items: readonly MaintenanceActivity[]; // sudah difilter tipe & pencarian
  today: string; // YYYY-MM-DD, zona waktu plant
  loading: boolean;
  openId: string | null; // aktivitas yang sedang dibuka di drawer
  onOpen: (id: string) => void;
  onCreate: (date: string) => void;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const VISIBLE_PER_DAY = 3;
const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" });

// Warna mengikuti chip status di tabel: Pending oranye, Upcoming abu-abu, Done hijau.
const ITEM_STYLE: Record<MaintenanceStatus, string> = {
  PENDING: "bg-warn-soft text-warn-text before:bg-warn",
  UPCOMING: "bg-surface-3 text-text before:bg-muted",
  DONE: "bg-ok-soft text-ok-text before:bg-ok",
};
const DOT: Record<MaintenanceStatus, string> = { PENDING: "bg-warn", UPCOMING: "bg-muted", DONE: "bg-ok" };
const LEGEND_ORDER: readonly MaintenanceStatus[] = ["PENDING", "UPCOMING", "DONE"]; // sama dengan urutan tab

const pad = (n: number) => String(n).padStart(2, "0");

// Kalender bulanan jadwal O&M (tab All): aktivitas di tanggalnya, diwarnai per status; klik
// membuka detail, "+" di tiap tanggal menambah aktivitas pada tanggal itu. Di layar sempit
// tampil sebagai agenda (daftar tanggal yang punya aktivitas).
export function MaintenanceCalendar({ items, today, loading, openId, onOpen, onCreate }: Props) {
  const [view, setView] = useState<[number, number]>(() => [Number(today.slice(0, 4)), Number(today.slice(5, 7))]);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => new Set());
  const [year, month] = view;
  const monthKey = `${year}-${pad(month)}`;
  const monthLabel = MONTH_LABEL.format(new Date(Date.UTC(year, month - 1, 1)));
  const isCurrentMonth = monthKey === today.slice(0, 7);

  const byDate = useMemo(() => activitiesByDate(items, monthKey, today), [items, monthKey, today]);
  const weeks = useMemo(() => calendarWeeks(year, month), [year, month]);
  const total = [...byDate.values()].reduce((n, list) => n + list.length, 0);
  const agenda = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));

  const go = (next: [number, number]) => {
    setView(next);
    setExpanded(new Set());
  };
  const toggleDay = (date: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });

  const item = (a: MaintenanceActivity, compact: boolean) => {
    const status = maintenanceStatus(a, today);
    const TypeIcon = a.type === "CORRECTIVE" ? Wrench : CalendarDays;
    return (
      <button
        key={a.id}
        type="button"
        onClick={() => onOpen(a.id)}
        title={`${a.activity} · ${MAINTENANCE_TYPE_LABEL[a.type]} · ${MAINTENANCE_STATUS_LABEL[status]}`}
        aria-label={`${a.activity}, ${MAINTENANCE_TYPE_LABEL[a.type]}, ${MAINTENANCE_STATUS_LABEL[status]}`}
        className={cn(
          "relative flex w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-md pl-2.5 pr-1.5 text-left text-xs font-medium transition-[filter] before:absolute before:inset-y-0 before:left-0 before:w-1 hover:brightness-95 focus-visible:shadow-focus focus-visible:outline-none",
          compact ? "h-6" : "min-h-9 py-1.5",
          ITEM_STYLE[status],
          a.id === openId && "ring-2 ring-accent",
        )}
      >
        <TypeIcon className="size-3.5 shrink-0 opacity-80" aria-hidden />
        <span className={compact ? "truncate" : "line-clamp-2"}>{a.activity}</span>
      </button>
    );
  };

  return (
    <section className="rounded-2xl bg-surface-2 p-1" aria-label={`O&M calendar ${monthLabel}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5">
        <div className="flex items-center gap-1">
          <Button iconOnly size="sm" variant="ghost" onClick={() => go(shiftMonth(year, month, -1))} aria-label="Previous month">
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button iconOnly size="sm" variant="ghost" onClick={() => go(shiftMonth(year, month, 1))} aria-label="Next month">
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
        <h3 className="min-w-36 text-base font-semibold text-text" aria-live="polite">
          {monthLabel}
        </h3>
        <Button size="sm" onClick={() => go([Number(today.slice(0, 4)), Number(today.slice(5, 7))])} disabled={isCurrentMonth}>
          Today
        </Button>
        <span className="text-sm text-muted">
          {loading ? "Loading…" : `${total} ${total === 1 ? "activity" : "activities"}`}
        </span>
        <ul className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted" aria-label="Status legend">
          {LEGEND_ORDER.map((s) => (
            <li key={s} className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", DOT[s])} aria-hidden />
              {MAINTENANCE_STATUS_LABEL[s]}
            </li>
          ))}
        </ul>
      </div>

      {/* Grid bulan (md ke atas) */}
      <div className="hidden overflow-hidden rounded-xl bg-surface md:block">
        <table className="w-full table-fixed border-collapse text-sm">
          <caption className="sr-only">O&M schedule {monthLabel}</caption>
          <thead>
            <tr>
              {WEEKDAYS.map((d, i) => (
                <th key={d} scope="col" className={cn("h-9 px-2 text-left text-xs font-medium text-muted", i >= 5 && "text-muted/80")}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, w) => (
              <tr key={w}>
                {week.map((date, i) => {
                  if (!date) return <td key={`pad-${w}-${i}`} className="h-28 border-t border-border bg-bg/50 [&:not(:first-child)]:border-l" aria-hidden />;
                  const list = byDate.get(date) ?? [];
                  const open = expanded.has(date);
                  const shown = open ? list : list.slice(0, VISIBLE_PER_DAY);
                  const hidden = list.length - shown.length;
                  const isToday = date === today;
                  return (
                    <td key={date} className={cn("group h-28 border-t border-border p-1.5 align-top [&:not(:first-child)]:border-l", i >= 5 && "bg-bg/30")}>
                      <div className="mb-1 flex items-center justify-between">
                        <span
                          className={cn("grid size-6 place-items-center rounded-full font-mono text-xs", isToday ? "bg-brand font-semibold text-on-brand" : "text-muted")}
                          aria-label={`${formatScheduleDate(date, "long")}${isToday ? ", today" : ""}${list.length ? `, ${list.length} ${list.length === 1 ? "activity" : "activities"}` : ""}`}
                        >
                          {Number(date.slice(8))}
                        </span>
                        <button
                          type="button"
                          onClick={() => onCreate(date)}
                          aria-label={`Add activity on ${formatScheduleDate(date, "long")}`}
                          title="Add activity on this date"
                          className="grid size-6 place-items-center rounded-md text-muted opacity-0 transition-opacity hover:bg-surface-3 hover:text-text focus-visible:opacity-100 focus-visible:shadow-focus focus-visible:outline-none group-hover:opacity-100 pointer-coarse:opacity-100"
                        >
                          <Plus className="size-3.5" aria-hidden />
                        </button>
                      </div>
                      {loading ? (
                        date.endsWith("1") && <Skeleton className="h-6 w-full rounded-md" />
                      ) : (
                        <div className="grid gap-1">
                          {shown.map((a) => item(a, true))}
                          {(hidden > 0 || open) && list.length > VISIBLE_PER_DAY && (
                            <button type="button" onClick={() => toggleDay(date)} aria-expanded={open} className="h-5 rounded px-1 text-left text-xs font-medium text-accent hover:underline">
                              {open ? "Show less" : `+${hidden} more`}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Agenda (layar sempit) */}
      <div className="rounded-xl bg-surface md:hidden">
        {loading ? (
          <div className="grid gap-2 p-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : agenda.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted">No activities in {monthLabel}.</p>
        ) : (
          <ol className="divide-y divide-separator">
            {agenda.map(([date, list]) => (
              <li key={date} className="grid gap-1.5 px-3 py-3">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-medium", date === today ? "text-brand" : "text-text")}>
                    {new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", weekday: "short", day: "2-digit", month: "short" }).format(parseDateKey(date))}
                    {date === today && <span className="ml-1.5 text-xs font-normal">· Today</span>}
                  </span>
                  <Button iconOnly size="sm" variant="ghost" onClick={() => onCreate(date)} aria-label={`Add activity on ${formatScheduleDate(date, "long")}`}>
                    <Plus className="size-4" aria-hidden />
                  </Button>
                </div>
                {list.map((a) => item(a, false))}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
