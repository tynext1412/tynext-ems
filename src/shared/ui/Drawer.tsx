import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode; // tombol aksi di bawah (Cancel / Submit)
  className?: string;
}

const SPRING = { type: "spring", stiffness: 340, damping: 36 } as const;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Panel kartu mengambang dari sisi kanan (lebar 560 px, sudut 24 px) untuk form dan detail.
// Escape atau klik backdrop menutup; fokus masuk ke panel saat dibuka dan kembali saat ditutup.
export function Drawer({ open, onClose, title, children, footer, className }: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    panelRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Tutup panel"
            className="fixed inset-0 z-40 bg-ink/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cn("fixed inset-y-3 right-3 z-50 flex w-[calc(100vw-24px)] max-w-[560px] flex-col overflow-hidden rounded-3xl bg-surface shadow-overlay outline-none", className)}
            initial={reducedMotion ? { opacity: 0 } : { x: "calc(100% + 12px)" }}
            animate={reducedMotion ? { opacity: 1 } : { x: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { x: "calc(100% + 12px)" }}
            transition={reducedMotion ? { duration: 0.15 } : SPRING}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-separator px-5 py-3.5">
              <h2 id={titleId} className="text-base font-semibold">
                {title}
              </h2>
              <button type="button" onClick={onClose} aria-label="Tutup" className="inline-flex size-8 items-center justify-center rounded-full bg-surface-3 text-text hover:bg-border">
                <X className="size-4" aria-hidden />
              </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
            {footer && <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-separator px-5 py-4">{footer}</footer>}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
