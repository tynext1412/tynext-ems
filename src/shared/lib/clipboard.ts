import { useCallback, useEffect, useRef, useState } from "react";

// Salin teks ke clipboard dengan konfirmasi singkat (copied = true selama ~1,5 detik).
export function useCopy(resetMs = 1500) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCopied(false), resetMs);
      } catch {
        /* clipboard tidak tersedia; nilai tetap terlihat untuk disalin manual */
      }
    },
    [resetMs],
  );
  return { copied, copy };
}
