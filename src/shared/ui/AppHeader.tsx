import { RefreshCw, WifiOff } from "lucide-react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { UserMenu } from "@/domains/auth/ui/UserMenu";
import { cn } from "@/shared/lib/cn";
import { useInitialLoading, useLastUpdated, useOnline, useRefreshAll } from "@/shared/lib/refresh";
import { Toast } from "./Alert";
import { Brand } from "./Brand";
import { Spinner } from "./Spinner";

interface Props {
  className?: string;
  /** Konten tambahan di kiri logo (mis. tombol kembali di layar sempit). */
  leading?: React.ReactNode;
}

const WIB = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false });

// Header global 56 px: logo, pill "Last Updated" + tombol refresh di tengah, menu profil di kanan.
// Saat refresh: pill "Updating data", tombol jadi spinner, garis progres tipis di bawah header.
// Offline: pill "Offline · Last Updated …", refresh dinonaktifkan, alert di tengah bawah.
export function AppHeader({ className, leading }: Props) {
  const lastUpdated = useLastUpdated();
  const initialLoading = useInitialLoading();
  const online = useOnline();
  const { refresh, isRefreshing, isFetching, error, dismissError } = useRefreshAll();

  const time = lastUpdated ? `${WIB.format(new Date(lastUpdated)).replace(".", ":")} WIB` : undefined;
  const busy = isRefreshing || (isFetching && !initialLoading && lastUpdated !== undefined);

  let label: React.ReactNode;
  if (!online)
    label = (
      <span className="text-warn-text">
        Offline
        {time && (
          <span className="text-text">
            <span className="hidden sm:inline"> · Last Updated:</span> {time}
          </span>
        )}
      </span>
    );
  else if (initialLoading && !lastUpdated) label = "Loading latest data";
  else if (isRefreshing) label = "Updating data";
  else if (time)
    label = (
      <>
        <span className="hidden sm:inline">Last Updated: </span>
        <span className="font-medium">{time}</span>
      </>
    );
  else label = "Last Updated: –";

  return (
    <header className={cn("relative z-30 flex h-14 shrink-0 items-center justify-between gap-3 bg-surface px-4 md:px-6", className)}>
      <div className="flex min-w-0 items-center gap-2">
        {leading}
        <Link to="/" aria-label="Ke Home" className="flex shrink-0 items-center">
          <Brand className="hidden sm:flex" />
          <Brand compact className="sm:hidden" />
        </Link>
      </div>

      {/* Di layar lebar pill di tengah header; di layar sempit ikut baris (hanya jam + tombol). */}
      <div className="flex items-center gap-2 rounded-[10px] bg-bg px-2 py-1.5 sm:absolute sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2" aria-live="polite">
        {!online && <WifiOff className="size-4 text-warn-text" aria-hidden />}
        <span className="whitespace-nowrap text-sm leading-6 text-text">{label}</span>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={!online || isRefreshing || (initialLoading && !lastUpdated)}
          aria-label="Muat ulang semua data"
          title="Muat ulang semua data"
          className="refresh-button inline-grid size-6 place-items-center rounded-lg transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRefreshing ? <Spinner className="size-3.5 text-white" /> : <RefreshCw className="size-3.5" aria-hidden />}
        </button>
      </div>

      <UserMenu />

      {busy && (
        <div className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden" aria-hidden>
          <div className="progress-indeterminate h-full w-full" />
        </div>
      )}

      {/* Alert mengambang di tengah bawah layar (portal ke body supaya di atas backdrop sheet). */}
      {createPortal(
        <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex flex-col items-center gap-2 px-4">
          {!online && (
            <Toast tone="warning" action={<RetryButton onClick={() => void refresh()}>Try now</RetryButton>}>
              You're offline. Data yang tampil adalah data terakhir; sambungan dicoba ulang otomatis.
            </Toast>
          )}
          {online && error && (
            <Toast
              tone="danger"
              action={
                <span className="flex items-center gap-1">
                  <RetryButton onClick={() => void refresh()}>Try again</RetryButton>
                  <RetryButton onClick={dismissError} aria-label="Tutup">
                    ×
                  </RetryButton>
                </span>
              }
            >
              Couldn't refresh data
            </Toast>
          )}
        </div>,
        document.body,
      )}
    </header>
  );
}

function RetryButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className="inline-flex h-7 shrink-0 items-center rounded-lg bg-white/70 px-2.5 text-xs font-medium text-text hover:bg-white dark:bg-black/30 dark:hover:bg-black/50" {...props}>
      {children}
    </button>
  );
}
