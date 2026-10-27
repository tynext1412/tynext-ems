import { animate, motion, useDragControls, useMotionValue, useMotionValueEvent, useReducedMotion, type PanInfo } from "framer-motion";
import { X } from "lucide-react";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Isi bar saat sheet tertutup (ringkasan + ajakan geser). */
  peek: ReactNode;
  peekHeight?: number;
  className?: string;
  children: ReactNode;
}

const SPRING = { type: "spring", stiffness: 320, damping: 34, mass: 0.9 } as const;
const HANDLE_HEIGHT = 14;

/**
 * Sheet dari bawah layar, seperti panel komentar di Reels: saat tertutup hanya
 * bar ringkas yang terlihat; geser/klik ke atas untuk membuka, geser ke bawah,
 * klik backdrop, atau Escape untuk menutup. Konten di dalamnya scroll sendiri.
 */
export function BottomSheet({ open, onOpenChange, title, peek, peekHeight = 76, className, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const dragControls = useDragControls();
  const reducedMotion = useReducedMotion();

  // Mulai di luar layar supaya sheet "masuk" saat halaman pertama dirender,
  // bukan berkedip di posisi terbuka sebelum tinggi terukur.
  const y = useMotionValue(typeof window === "undefined" ? 1000 : window.innerHeight);
  // Jarak geser saat tertutup = tinggi sheet - tinggi peek bar. Disimpan di ref
  // supaya settle() selalu membaca nilai terukur, dan di state untuk dragConstraints.
  const closedYRef = useRef(0);
  const [closedY, setClosedY] = useState(0);
  // Dibaca oleh measure() di bawah, yang hidup lebih lama dari satu render.
  const openRef = useRef(open);
  useLayoutEffect(() => {
    openRef.current = open;
  }, [open]);
  // Backdrop mengikuti posisi sheet: 0 saat tertutup, 1 saat terbuka penuh.
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
      // Pengukuran pertama = animasi masuk dari bawah; perubahan viewport = langsung snap.
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

  useEffect(() => {
    if (open) closeButtonRef.current?.focus({ preventScroll: true });
  }, [open]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const threshold = closedY * 0.25;
    let next = open;
    if (info.velocity.y < -400 || info.offset.y < -threshold) next = true;
    else if (info.velocity.y > 400 || info.offset.y > threshold) next = false;

    if (next !== open) onOpenChange(next);
    else settle(open);
  };

  return (
    <>
      <motion.div
        aria-hidden
        className="fixed inset-0 z-20 bg-ink/40"
        style={{ opacity: backdropOpacity, pointerEvents: open ? "auto" : "none" }}
        onClick={() => onOpenChange(false)}
      />

      <motion.div
        ref={sheetRef}
        role={open ? "dialog" : undefined}
        aria-modal={open || undefined}
        aria-labelledby={open ? titleId : undefined}
        className={cn(
          "brand-edge fixed inset-x-0 bottom-0 z-30 flex h-[88dvh] flex-col rounded-t-2xl border border-b-0 border-border bg-surface shadow-[0_-24px_60px_rgba(27,29,31,0.18)]",
          className,
        )}
        style={{ y }}
        drag="y"
        dragListener={false}
        dragControls={dragControls}
        dragConstraints={{ top: 0, bottom: closedY }}
        dragElastic={0.04}
        dragMomentum={false}
        onDragEnd={onDragEnd}
      >
        {/* Area pegangan: gestur geser dimulai dari sini, bukan dari konten yang scroll. */}
        <div
          className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-border" style={{ height: 6, marginBottom: HANDLE_HEIGHT - 14 }} />


          {open ? (
            <div className="flex items-center justify-between gap-4 px-5 py-3">
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Tutup daftar site"
                className="grid size-11 place-items-center rounded-md text-muted hover:bg-surface-2 hover:text-text"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenChange(true)}
              aria-expanded={false}
              className="flex w-full items-center px-5 text-left"
              style={{ height: peekHeight - HANDLE_HEIGHT }}
            >
              {peek}
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-8" inert={!open}>
          {children}
        </div>
      </motion.div>
    </>
  );
}
