import { useCallback, useState } from "react";

// Payload event recharts yang kita pakai; tipe internalnya tidak diekspor.
interface ChartPointerState {
  activeLabel?: string | number;
}

const MIN_DRAG_MINUTES = 10;

// Seret di atas chart untuk memilih rentang waktu; lepas → onZoom(from, to).
// Seretan terlalu pendek dianggap klik biasa (tidak mengubah zoom).
export function useDragZoom(onZoom: (from: number, to: number) => void) {
  const [start, setStart] = useState<number | null>(null);
  const [end, setEnd] = useState<number | null>(null);

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
      if (start === null || state?.activeLabel === undefined) return;
      setEnd(Number(state.activeLabel));
    },
    [start],
  );

  const onMouseUp = useCallback(() => {
    if (start !== null && end !== null && Math.abs(end - start) >= MIN_DRAG_MINUTES) {
      onZoom(Math.min(start, end), Math.max(start, end));
    }
    reset();
  }, [start, end, onZoom, reset]);

  const selection: readonly [number, number] | null = start !== null && end !== null ? [Math.min(start, end), Math.max(start, end)] : null;

  return {
    selection,
    handlers: { onMouseDown, onMouseMove, onMouseUp, onMouseLeave: reset },
  };
}
