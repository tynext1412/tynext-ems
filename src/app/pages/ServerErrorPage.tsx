import { Link } from "react-router-dom";
import { CopyButton } from "@/shared/ui/CopyButton";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";

interface Props {
  referenceCode: string;
  onRetry: () => void;
  error?: Error;
}

// Halaman 500: galat tak terduga di subtree aplikasi. Kode referensi untuk dilaporkan ke tim.
export function ServerErrorPage({ referenceCode, onRetry, error }: Props) {
  return (
    <main className="grid h-dvh place-items-center bg-bg p-6">
      <div className="w-full max-w-lg rounded-3xl bg-surface p-6 shadow-surface">
        <EmptyState
          illustration="server-error"
          size="lg"
          title="Something broke on our end"
          description={
            <>
              Terjadi galat yang tidak terduga. Coba lagi, atau kembali ke dashboard.
              {error?.message && <span className="mt-2 block font-mono text-xs text-muted">{error.message}</span>}
            </>
          }
          action={
            <>
              <Button variant="primary" onClick={onRetry}>
                Try again
              </Button>
              <Link to="/" onClick={onRetry} className="inline-flex h-9 items-center rounded-xl border border-border bg-surface px-3.5 text-sm font-medium text-text hover:bg-surface-2">
                Back to Dashboard
              </Link>
            </>
          }
        />
        <p className="mt-2 flex items-center justify-center gap-1 text-xs text-muted">
          Reference code <span className="font-mono text-text">{referenceCode}</span>
          <CopyButton value={referenceCode} label="kode referensi" />
        </p>
      </div>
    </main>
  );
}
