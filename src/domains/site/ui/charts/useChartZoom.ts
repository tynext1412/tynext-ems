import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { isFullDay, zoomAround, zoomIn, zoomOut, type TimeWindow } from "../../domain/period";

// Payload event recharts yang kita pakai; tipe internalnya tidak diekspor.
interface ChartPointerState {
  activeLabel?: string | number;
}

const MIN_DRAG_MINUTES = 10;
const WHEEL_STEP = 120; // deltaY satu notch roda mouse; trackpad mengirim delta kecil

// Zoom sumbu waktu tanpa tombol: scroll di atas grafik memperbesar di sekitar kursor
// (halaman tidak ikut bergulir kecuali sudah hari penuh), seret memilih rentang,
// klik dua kali atau tombol 0 mereset, tombol + / − untuk keyboard.
export function useChartZoom(window: TimeWindow, onZoom: (from: number, to: number) => void, onReset: () => void) {
  const [start, setStart] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null);
  const anchor = useRef<number | null>(null); // waktu di bawah kursor, dari recharts
  const windowRef = useRef(window);
  useEffect(() => {
    windowRef.current = window;
  }, [window]);

  const apply = useCallback(
    (next: TimeWindow) => {
      if (isFullDay(next)) onReset();
      else onZoom(next[0], next[1]);
    },
    [onZoom, onReset],
  );

  // Listener wheel non-pasif (preventDefault menahan gulir halaman) dipasang lewat callback ref,
  // karena elemen grafik baru ada setelah data dimuat; cleanup ref dijalankan saat elemen lepas.
  const applyRef = useRef(apply);
  useEffect(() => {
    applyRef.current = apply;
  }, [apply]);
  const frameRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const w = windowRef.current;
      if (e.deltaY > 0 && isFullDay(w)) return; // tidak ada lagi yang diperkecil: biarkan halaman bergulir
      e.preventDefault();
      const factor = Math.exp((Math.max(-WHEEL_STEP, Math.min(WHEEL_STEP, e.deltaY)) / WHEEL_STEP) * 0.35);
      applyRef.current(zoomAround(w, anchor.current ?? (w[0] + w[1]) / 2, factor));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const reset = useCallback(() => {
    setStart(null);
    setEnd(null);
  }, []);

  const onMouseDown = useCallback((state?: ChartPointerState) => {
    if (state?.activeLabel === undefined) return;
    setStart(Number(state.activeLabel));
    setEnd(null);
  }, []);

  const onMouseMove = useCallback(
    (state?: ChartPointerState) => {
      if (state?.activeLabel === undefined) return;
      anchor.current = Number(state.activeLabel);
      if (start !== null) setEnd(Number(state.activeLabel));
    },
    [start],
  );

  const onMouseUp = useCallback(() => {
    if (start !== null && end !== null && Math.abs(end - start) >= MIN_DRAG_MINUTES) {
      onZoom(Math.min(start, end), Math.max(start, end));
    }
    reset();
  }, [start, end, onZoom, reset]);

  const onMouseLeave = useCallback(() => {
    anchor.current = null;
    reset();
  }, [reset]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const w = windowRef.current;
      if (e.key === "+" || e.key === "=") apply(zoomIn(w));
      else if (e.key === "-" || e.key === "_") apply(zoomOut(w));
      else if (e.key === "0" || e.key === "Escape") onReset();
      else return;
      e.preventDefault();
    },
    [apply, onReset],
  );

  const selection: readonly [number, number] | null = start !== null && end !== null ? [Math.min(start, end), Math.max(start, end)] : null;

  return {
    selection,
    handlers: { onMouseDown, onMouseMove, onMouseUp, onMouseLeave },
    frameProps: {
      ref: frameRef,
      tabIndex: 0,
      role: "group" as const,
      "aria-label": "Chart; scroll or press + and − to zoom, 0 to reset",
      onDoubleClick: onReset,
      onKeyDown,
      className: "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent",
    },
  };
}
