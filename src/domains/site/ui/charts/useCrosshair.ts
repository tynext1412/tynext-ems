import { useCallback, useState } from "react";

// Posisi kursor di dalam chart recharts: label sumbu X aktif (menit) dan koordinat y piksel.
export interface HoverPoint {
  x: number;
  y: number;
}

interface PointerState {
  activeLabel?: string | number;
  chartY?: number;
  isTooltipActive?: boolean;
}

// Menyimpan posisi kursor dari event onMouseMove/onMouseLeave recharts.
export function useCrosshair() {
  const [hover, setHover] = useState<HoverPoint | null>(null);
  const onMove = useCallback((state?: PointerState) => {
    if (state?.activeLabel === undefined || state.chartY === undefined) {
      setHover(null);
      return;
    }
    setHover({ x: Number(state.activeLabel), y: state.chartY });
  }, []);
  const onLeave = useCallback(() => setHover(null), []);
  return { hover, onMove, onLeave };
}

interface ZoomHandlers {
  onMouseDown: (state?: { activeLabel?: string | number }) => void;
  onMouseMove: (state?: { activeLabel?: string | number }) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

// Event mouse chart dipakai dua fitur: seleksi zoom (useChartZoom) dan crosshair.
export function withCrosshair(zoom: ZoomHandlers, crosshair: ReturnType<typeof useCrosshair>) {
  return {
    ...zoom,
    onMouseMove: (state?: PointerState) => {
      zoom.onMouseMove(state);
      crosshair.onMove(state);
    },
    onMouseLeave: () => {
      zoom.onMouseLeave();
      crosshair.onLeave();
    },
  };
}
