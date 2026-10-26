import { useCallback, useState } from "react";
import type { SeriesKey } from "./chart-theme";

export function useSeriesToggle() {
  const [hidden, setHidden] = useState<ReadonlySet<SeriesKey>>(() => new Set());
  const toggle = useCallback((key: SeriesKey) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);
  return { hidden, toggle };
}
