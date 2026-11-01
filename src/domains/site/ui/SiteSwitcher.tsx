import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlants } from "@/domains/plant/application/use-plants";
import { PLANT_STATUS_LABEL, type Plant } from "@/domains/plant/domain/plant";
import { searchPlants } from "@/domains/plant/domain/search";
import { STATUS_COLOR } from "@/domains/plant/ui/status-color";
import { cn } from "@/shared/lib/cn";
import { Input } from "@/shared/ui/Input";
import { Skeleton } from "@/shared/ui/Skeleton";

interface Props {
  current: Plant;
  trailing?: React.ReactNode; // chip status di antara nama dan panah
}

// Nama site di header sekaligus pemilih site: buka daftar, cari nama, pilih,
// dan menu yang sedang dibuka (mis. Alarm) tetap dipertahankan di site tujuan.
export function SiteSwitcher({ current, trailing }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useReducedMotion();
  const listId = useId();

  const { data: plants, isPending, error } = usePlants();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo(() => searchPlants(plants ?? [], query), [plants, query]);
  const subRoute = location.pathname.replace(/^\/plants\/[^/]+/, "");

  const close = (restoreFocus = true) => {
    setOpen(false);
    setQuery("");
    setHighlight(0);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const select = (plant: Plant) => {
    close(false);
    if (plant.id !== current.id) navigate(`/plants/${plant.id}${subRoute}`);
  };

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus({ preventScroll: true });
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (items.length ? (h + 1) % items.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (items.length ? (h - 1 + items.length) % items.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const plant = items[highlight];
      if (plant) select(plant);
    }
  };

  return (
    // Di layar sempit popover diposisikan terhadap header (lebar penuh dengan gutter);
    // di desktop terhadap tombol nama site.
    <div ref={rootRef} className="min-w-0 md:relative">
      <h1 className="min-w-0 text-xl font-semibold leading-7">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => (open ? close() : setOpen(true))}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          className="flex h-7 max-w-full items-center gap-2 rounded-xl text-left hover:bg-surface-2"
        >
          <span className="truncate">{current.name}</span>
          {trailing}
          <ChevronDown className={cn("size-5 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden />
          <span className="sr-only">, choose another site</span>
        </button>
      </h1>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            onKeyDown={onKeyDown}
            className="absolute inset-x-4 top-full z-20 mt-1 rounded-2xl border border-border bg-surface p-2 shadow-overlay md:inset-x-auto md:left-0 md:mt-2 md:w-[380px]"
          >
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <Input
                ref={inputRef}
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-activedescendant={items[highlight] ? `${listId}-${items[highlight].id}` : undefined}
                aria-autocomplete="list"
                aria-label="Search sites"
                placeholder="Search site name"
                className="w-full pl-8"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
              />
            </div>

            <ul id={listId} role="listbox" aria-label="Site list" className="mt-2 max-h-72 overflow-y-auto overscroll-contain">
              {isPending && (
                <li className="px-2 py-2" aria-busy>
                  <Skeleton className="h-5 w-48" />
                  <span className="sr-only">Loading site list…</span>
                </li>
              )}
              {error && (
                <li role="alert" className="px-2 py-2 text-sm text-danger">
                  The site list couldn't load: {error.message}.
                </li>
              )}
              {!isPending && !error && items.length === 0 && (
                <li className="px-2 py-3 text-sm text-muted">No sites named "{query}".</li>
              )}
              {items.map((plant, i) => {
                const active = plant.id === current.id;
                return (
                  <li
                    key={plant.id}
                    id={`${listId}-${plant.id}`}
                    role="option"
                    aria-selected={active}
                    onPointerDown={(e) => e.preventDefault()}
                    onClick={() => select(plant)}
                    onMouseEnter={() => setHighlight(i)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-sm",
                      i === highlight && "bg-surface-2",
                    )}
                  >
                    <span className="size-2 shrink-0 rounded-full" style={{ background: STATUS_COLOR[plant.status] }} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{plant.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {plant.location.address} · {PLANT_STATUS_LABEL[plant.status]}
                      </span>
                    </span>
                    {active && <Check className="size-4 shrink-0 text-brand" aria-label="current site" />}
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
