import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState, useSyncExternalStore } from "react";

// Query sesi tidak ikut dihitung sebagai "data halaman".
const isDataQuery = (q: { queryKey: readonly unknown[] }) => q.queryKey[0] !== "auth";

// Waktu data terakhir berhasil diambil: dataUpdatedAt terbesar dari query aktif yang sukses.
export function useLastUpdated(): number | undefined {
  const queryClient = useQueryClient();
  const cache = queryClient.getQueryCache();
  return useSyncExternalStore(
    (onChange) => cache.subscribe(onChange),
    () => {
      let max = 0;
      for (const q of cache.getAll()) {
        if (q.state.status === "success" && q.getObserversCount() > 0 && isDataQuery(q)) max = Math.max(max, q.state.dataUpdatedAt);
      }
      return max || undefined;
    },
    () => undefined,
  );
}

// Apakah ada query aktif yang belum pernah punya data (load pertama halaman).
export function useInitialLoading(): boolean {
  const queryClient = useQueryClient();
  const cache = queryClient.getQueryCache();
  return useSyncExternalStore(
    (onChange) => cache.subscribe(onChange),
    () => cache.getAll().some((q) => isDataQuery(q) && q.getObserversCount() > 0 && q.state.status === "pending" && q.state.fetchStatus === "fetching"),
    () => false,
  );
}

// Refresh manual: muat ulang semua query aktif; data lama tetap tampil sampai yang baru datang.
export function useRefreshAll() {
  const queryClient = useQueryClient();
  const fetching = useIsFetching({ predicate: isDataQuery });
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    setRunning(true);
    setError(null);
    try {
      await queryClient.refetchQueries({ type: "active", predicate: isDataQuery }, { throwOnError: true });
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Refresh gagal"));
    } finally {
      setRunning(false);
    }
  }, [queryClient]);

  const dismissError = useCallback(() => setError(null), []);

  return { refresh, isRefreshing: running, isFetching: fetching > 0, error, dismissError };
}

// Status koneksi browser; reconnect otomatis dilakukan TanStack Query saat kembali online.
export function useOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      window.addEventListener("online", onChange);
      window.addEventListener("offline", onChange);
      return () => {
        window.removeEventListener("online", onChange);
        window.removeEventListener("offline", onChange);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}
