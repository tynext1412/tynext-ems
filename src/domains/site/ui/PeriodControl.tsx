import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { GRANULARITY_LABEL, type Granularity, type Period } from "@/domains/performance/domain/performance";
import { parseDateKey } from "@/shared/domain/time";
import { cn } from "@/shared/lib/cn";
import { Tabs } from "@/shared/ui/Tabs";
import { calendarWeeks, inRange, selectableYears, shiftMonth } from "../domain/period";

interface Props {
  period: Period;
  onChange: (period: Period) => void;
  granularities: readonly Granularity[];
  minDate: string; // commissioning plant
  today: string;
}

const DAY_LABEL = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
const MONTH_LABEL = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "short", year: "numeric" });
const MONTH_LONG = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", month: "long", year: "numeric" });
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; // en-GB Intl menulis "Sept"
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const pad = (n: number) => String(n).padStart(2, "0");

function chipLabel({ granularity, date }: Period): string {
  if (granularity === "day") return DAY_LABEL.format(parseDateKey(date));
  if (granularity === "month") return MONTH_LABEL.format(parseDateKey(date));
  return date.slice(0, 4);
}

function viewOf(date: string): [number, number] {
  return [Number(date.slice(0, 4)), Number(date.slice(5, 7))];
}

// Kontrol periode seperti di desain: chip tanggal (ikon kalender, tanggal, panah) dan tab segmen
// Day/Month/Year/Lifetime. Chip membuka popover sesuai granularitas: kalender hari, grid bulan,
// atau daftar tahun; hanya rentang commissioning–hari ini yang bisa dipilih.
export function PeriodControl({ period, onChange, granularities, minDate, today }: Props) {
  const reducedMotion = useReducedMotion();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<[number, number]>(() => viewOf(period.date)); // [tahun, bulan] yang sedang dilihat

  useEffect(() => {
    if (!open) return;
    // Fokus ke pilihan aktif (atau sel pertama yang aktif) supaya keyboard langsung bisa dipakai.
    const panel = panelRef.current;
    (panel?.querySelector<HTMLButtonElement>("[aria-pressed=true]:not(:disabled)") ?? panel?.querySelector<HTMLButtonElement>("[data-cell]:not(:disabled)"))?.focus();
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) setView(viewOf(period.date));
    setOpen((o) => !o);
  };

  const choose = (date: string) => {
    onChange({ granularity: period.granularity, date });
    setOpen(false);
    triggerRef.current?.focus();
  };

  const [year, month] = view;
  const prevMonth = shiftMonth(year, month, -1);
  const nextMonth = shiftMonth(year, month, 1);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {period.granularity !== "lifetime" && (
        <div ref={rootRef} className="relative">
          <button
            ref={triggerRef}
            type="button"
            onClick={toggle}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={`Choose period, currently ${chipLabel(period)}`}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] bg-surface px-2.5 text-sm text-text transition-colors hover:bg-surface-3 focus-visible:shadow-focus focus-visible:outline-none"
          >
            <CalendarDays className="size-4 text-muted" aria-hidden />
            <span className="font-mono">{chipLabel(period)}</span>
            <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} aria-hidden />
          </button>

          <AnimatePresence>
            {open && (
              <motion.div
                ref={panelRef}
                id={panelId}
                role="dialog"
                aria-label="Choose period"
                initial={reducedMotion ? false : { opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full z-50 mt-2 w-[284px] rounded-2xl border border-border bg-surface p-3 shadow-menu sm:left-auto sm:right-0"
              >
                {period.granularity === "day" && (
                  <>
                    <PickerHeader
                      label={MONTH_LONG.format(new Date(Date.UTC(year, month - 1, 1)))}
                      onPrev={() => setView(prevMonth)}
                      onNext={() => setView(nextMonth)}
                      prevDisabled={!inRange(`${prevMonth[0]}-${pad(prevMonth[1])}`, minDate, today)}
                      nextDisabled={!inRange(`${nextMonth[0]}-${pad(nextMonth[1])}`, minDate, today)}
                      unit="month"
                    />
                    <div className="grid grid-cols-7 text-center text-xs text-muted" aria-hidden>
                      {WEEKDAYS.map((d) => (
                        <span key={d} className="py-1">
                          {d}
                        </span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-0.5">
                      {calendarWeeks(year, month)
                        .flat()
                        .map((key, i) =>
                          key ? (
                            <Cell key={key} selected={key === period.date} current={key === today} disabled={!inRange(key, minDate, today)} onClick={() => choose(key)} label={DAY_LABEL.format(parseDateKey(key))} className="h-9">
                              {Number(key.slice(8))}
                            </Cell>
                          ) : (
                            <span key={`pad-${i}`} />
                          ),
                        )}
                    </div>
                  </>
                )}

                {period.granularity === "month" && (
                  <>
                    <PickerHeader
                      label={String(year)}
                      onPrev={() => setView([year - 1, month])}
                      onNext={() => setView([year + 1, month])}
                      prevDisabled={!inRange(String(year - 1), minDate, today)}
                      nextDisabled={!inRange(String(year + 1), minDate, today)}
                      unit="year"
                    />
                    <div className="grid grid-cols-3 gap-1">
                      {Array.from({ length: 12 }, (_, i) => {
                        const key = `${year}-${pad(i + 1)}`;
                        return (
                          <Cell key={key} selected={key === period.date.slice(0, 7)} current={key === today.slice(0, 7)} disabled={!inRange(key, minDate, today)} onClick={() => choose(`${key}-01`)} label={MONTH_LONG.format(new Date(Date.UTC(year, i, 1)))} className="h-10">
                            {MONTH_SHORT[i]}
                          </Cell>
                        );
                      })}
                    </div>
                  </>
                )}

                {period.granularity === "year" && (
                  <div className="grid grid-cols-3 gap-1">
                    {selectableYears(minDate, today).map((y) => (
                      <Cell key={y} selected={String(y) === period.date.slice(0, 4)} current={String(y) === today.slice(0, 4)} onClick={() => choose(`${y}-01-01`)} label={String(y)} className="h-10">
                        {y}
                      </Cell>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      <Tabs
        variant="segmented"
        aria-label="Period granularity"
        items={granularities.map((g) => ({ value: g, label: GRANULARITY_LABEL[g] }))}
        value={period.granularity}
        onChange={(g) => onChange({ granularity: g, date: today })}
      />
    </div>
  );
}

function PickerHeader({ label, onPrev, onNext, prevDisabled, nextDisabled, unit }: { label: string; onPrev: () => void; onNext: () => void; prevDisabled: boolean; nextDisabled: boolean; unit: "month" | "year" }) {
  const nav = "grid size-8 place-items-center rounded-lg text-muted hover:bg-surface-3 hover:text-text disabled:pointer-events-none disabled:opacity-40 focus-visible:shadow-focus focus-visible:outline-none";
  return (
    <div className="mb-2 flex items-center justify-between">
      <button type="button" onClick={onPrev} disabled={prevDisabled} aria-label={unit === "month" ? "Previous month" : "Previous year"} className={nav}>
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      <span className="text-sm font-medium text-text" aria-live="polite">
        {label}
      </span>
      <button type="button" onClick={onNext} disabled={nextDisabled} aria-label={unit === "month" ? "Next month" : "Next year"} className={nav}>
        <ChevronRight className="size-4" aria-hidden />
      </button>
    </div>
  );
}

function Cell({ children, selected, current, disabled, onClick, label, className }: { children: ReactNode; selected: boolean; current: boolean; disabled?: boolean; onClick: () => void; label: string; className?: string }) {
  return (
    <button
      type="button"
      data-cell
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={label}
      aria-current={current ? "date" : undefined}
      className={cn(
        "rounded-[10px] font-mono text-sm transition-colors focus-visible:shadow-focus focus-visible:outline-none disabled:pointer-events-none disabled:text-muted disabled:opacity-40",
        selected ? "bg-brand font-semibold text-on-brand" : "text-text hover:bg-surface-3",
        current && !selected && "font-semibold text-brand",
        className,
      )}
    >
      {children}
    </button>
  );
}
