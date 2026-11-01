import { animate, motion, useDragControls, useMotionValue, useMotionValueEvent, useReducedMotion, type PanInfo } from "framer-motion";
import { ChevronsDown, ChevronsUp } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { Chip } from "./Chip";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Baris judul yang selalu terlihat (judul, jumlah, legend); boleh bergantung pada keadaan terbuka. */
  header: ReactNode | ((open: boolean) => ReactNode);
  /** Jarak dari atas viewport saat terbuka (sheet berhenti di bawah kartu KPI). */
  topOffset?: number;
  peekHeight?: number;
  hintOpen?: string;
  hintClose?: string;
  "aria-label"?: string;
  className?: string;
  children: ReactNode;
}

const SPRING = { type: "spring", stiffness: 320, damping: 34, mass: 0.9 } as const;

/**
 * Sheet dari bawah layar seperti di desain Home: tertutup = bar putih 84 px dengan judul dan
 * legend; tombol bundar berpanah di tengah atas membuka/menutup, bisa juga digeser.
 * Terbuka = sheet naik sampai di bawah kartu KPI, peta di belakangnya digelapkan.
 */
export function BottomSheet({ open, onOpenChange, header, topOffset = 176, peekHeight = 84, hintOpen = "Geser atau klik untuk membuka", hintClose = "Geser atau klik untuk menutup", className, children, ...rest }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const dragControls = useDragControls();
  const reducedMotion = useReducedMotion();

  const y = useMotionValue(typeof window === "undefined" ? 1000 : window.innerHeight);
  const closedYRef = useRef(0);
  const [closedY, setClosedY] = useState(0);
  const openRef = useRef(open);
  useLayoutEffect(() => {
    openRef.current = open;
  }, [open]);
  const backdropOpacity = useMotionValue(0);
  useMotionValueEvent(y, "change", (v) => {
    const max = closedYRef.current;
    backdropOpacity.set(max > 0 ? Math.min(1, Math.max(0, 1 - v / max)) : 0);
  });

  const settle = useCallback(
    (target: boolean, immediate = false) => {
      const to = target ? 0 : closedYRef.current;
      if (immediate || reducedMotion) {
        y.set(to);
        return;
      }
      animate(y, to, SPRING);
    },
    [reducedMotion, y],
  );

  useLayoutEffect(() => {
    const el = sheetRef.current;
    if (!el) return;
    const measure = () => {
      const firstMeasure = closedYRef.current === 0;
      closedYRef.current = Math.max(0, el.offsetHeight - peekHeight);
      setClosedY(closedYRef.current);
      settle(openRef.current, !firstMeasure);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [peekHeight, settle]);

  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (prevOpenRef.current === open) return;
    prevOpenRef.current = open;
    settle(open);
  }, [open, settle]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = closedY * 0.25;
    let next = open;
    if (info.velocity.y < -400 || info.offset.y < -threshold) next = true;
    else if (info.velocity.y > 400 || info.offset.y > threshold) next = false;
    if (next !== open) onOpenChange(next);
    else settle(open);
  };

  const toggle = () => onOpenChange(!open);

  return (
    <>
      <motion.div aria-hidden className="fixed inset-0 z-20 bg-black/70" style={{ opacity: backdropOpacity, pointerEvents: open ? "auto" : "none" }} onClick={() => onOpenChange(false)} />

      <motion.div
        ref={sheetRef}
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-labelledby={open ? titleId : undefined}
        aria-label={rest["aria-label"]}
        className={cn("fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-3xl bg-surface", className)}
        style={{ y, height: `calc(100dvh - ${topOffset}px)` }}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: closedY }}
        dragElastic={0.04}
        dragMomentum={false}
        onDragEnd={onDragEnd}
      >
        {/* Petunjuk dan tombol buka/tutup di tengah tepi atas sheet. */}
        <div className="pointer-events-none absolute inset-x-0 -top-16 flex flex-col items-center gap-4">
          <Chip tone="neutral" size="lg" className="pointer-events-auto bg-surface-3 text-xs font-normal text-text">
            {open ? hintClose : hintOpen}
          </Chip>
          <button
            type="button"
            onClick={toggle}
            onPointerDown={(e) => dragControls.start(e)}
            aria-expanded={open}
            aria-label={open ? "Tutup daftar site" : "Buka daftar site"}
            className="pointer-events-auto grid size-10 cursor-grab touch-none place-items-center rounded-full bg-surface text-text shadow-overlay active:cursor-grabbing"
          >
            {open ? <ChevronsDown className="size-5" aria-hidden /> : <ChevronsUp className="size-5" aria-hidden />}
          </button>
        </div>

        {/* Baris judul: area pegangan geser; klik membuka saat tertutup. */}
        <div
          className={cn("shrink-0 touch-none select-none px-6", !open && "cursor-pointer")}
          style={{ minHeight: peekHeight }}
          onPointerDown={(e) => dragControls.start(e)}
          onClick={() => {
            if (!open) onOpenChange(true);
          }}
        >
          <div id={titleId} className="flex items-start justify-between gap-4 pt-4">
            {typeof header === "function" ? header(open) : header}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6" inert={!open}>
          {children}
        </div>
      </motion.div>
    </>
  );
}
