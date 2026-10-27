import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useSession } from "../application/use-auth";

// Penjaga rute: tanpa sesi → /login (tujuan semula disimpan di state supaya kembali setelah masuk).
export function RequireAuth() {
  const session = useSession();
  const location = useLocation();
  if (session.isPending) {
    return (
      <div className="grid h-dvh place-items-center" aria-busy>
        <Skeleton className="h-6 w-40" />
        <span className="sr-only">Memeriksa sesi…</span>
      </div>
    );
  }
  if (!session.data) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <Outlet />;
}
