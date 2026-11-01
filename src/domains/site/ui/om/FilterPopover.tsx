import { Funnel, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "@/shared/ui/Button";
import { CountBadge } from "@/shared/ui/Chip";

interface Props {
  activeCount?: number; // jumlah filter yang sedang diterapkan (badge di tombol)
  onApply: () => void;
  onReset: () => void;
  onOpen?: () => void; // sinkronkan draft dengan nilai yang diterapkan saat dibuka
  children: ReactNode; // kontrol filter (Select/Field)
}

// Tombol "Filter" + popover (judul, kontrol, Reset/Apply) seperti frame "Dropdown Filter" di Figma.
// Nilai draft dikelola pemanggil; Apply/Reset hanya memberi tahu lalu menutup popover.
export function FilterPopover({ activeCount = 0, onApply, onReset, onOpen, children }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) onOpen?.();
    setOpen((o) => !o);
  };

  return (
    <div ref={rootRef} className="relative">
      <Button onClick={toggle} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} className="font-normal">
        <Funnel className="size-4" aria-hidden />
        Filter
        {activeCount > 0 && <CountBadge value={activeCount} className="bg-brand-soft text-brand" />}
      </Button>

      {open && (
        <div id={id} role="dialog" aria-label="Filter" className="absolute right-0 top-full z-30 mt-2 w-[312px] rounded-xl border border-border bg-surface shadow-overlay">
          <div className="flex items-center justify-between border-b border-separator px-4 py-3">
            <h3 className="text-base font-semibold">Filter</h3>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close filter" className="inline-grid size-7 place-items-center rounded-md bg-bg text-text hover:bg-surface-3">
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
          <div className="grid gap-4 p-4">{children}</div>
          <div className="flex items-center justify-between border-t border-separator px-4 py-3">
            <Button
              variant="ghost"
              onClick={() => {
                onReset();
                setOpen(false);
              }}
            >
              Reset
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onApply();
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
