import { useEffect, useState } from "react";

// Waktu sekarang yang diperbarui tiap interval, untuk label "x menit lalu".
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
