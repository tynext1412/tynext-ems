import { useState } from "react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/shared/ui/Button";
import { Dialog } from "@/shared/ui/Dialog";
import { ILLUSTRATION } from "@/shared/ui/EmptyState";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useSession, wasExplicitSignOut } from "../application/use-auth";

// Penjaga rute: tanpa sesi → /login (tujuan semula disimpan di state supaya kembali setelah masuk).
// Sesi yang habis di tengah pemakaian ditampilkan sebagai dialog "Sign in again", bukan lompat halaman.
export function RequireAuth() {
  const session = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  // Pernah punya sesi di tab ini → bila sesi hilang bukan karena sign out, tampilkan dialog sesi habis.
  const [hadSession, setHadSession] = useState(false);
  if (session.data && !hadSession) setHadSession(true); // state turunan dari render sebelumnya

  if (session.isPending) {
    return (
      <div className="grid h-dvh place-items-center" aria-busy>
        <Skeleton className="h-6 w-40" />
        <span className="sr-only">Memeriksa sesi…</span>
      </div>
    );
  }

  const from = location.pathname + location.search;

  if (!session.data) {
    if (hadSession && !wasExplicitSignOut()) {
      return (
        <Dialog
          open
          title="Sesi Anda telah berakhir"
          description="Masuk kembali untuk melanjutkan. Anda akan dikembalikan ke halaman yang sama."
          actions={
            <Button variant="primary" onClick={() => navigate("/login", { replace: true, state: { from } })}>
              Sign in again
            </Button>
          }
        >
          <img src={ILLUSTRATION["session-expired"]} alt="" className="mx-auto h-28 w-auto" />
        </Dialog>
      );
    }
    return <Navigate to="/login" replace state={{ from }} />;
  }

  return <Outlet />;
}
