import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface DialogProps {
  open: boolean;
  onClose?: () => void; // tidak ada = dialog tidak bisa ditutup selain lewat aksi (mis. sesi habis)
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Dialog di tengah layar untuk konfirmasi (sign out) atau pemberitahuan (sesi habis).
export function Dialog({ open, onClose, title, description, children, actions, className }: DialogProps) {
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
    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panelRef.current)?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCloseRef.current) {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstItem = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === firstItem || document.activeElement === panelRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        firstItem.focus();
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
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-ink/50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
          <motion.div
            ref={panelRef}
            role={onClose ? "dialog" : "alertdialog"}
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className={cn("relative w-full max-w-md rounded-3xl bg-surface p-6 shadow-dialog outline-none", className)}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-lg font-semibold">
                {title}
              </h2>
              {onClose && (
                <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 -mt-2 inline-flex size-8 items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-text">
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </div>
            {description && <p className="mt-2 text-sm text-muted">{description}</p>}
            {children && <div className="mt-4">{children}</div>}
            {actions && <div className="mt-6 flex flex-wrap justify-end gap-2">{actions}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
