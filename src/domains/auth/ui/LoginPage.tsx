import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../application/use-auth";
import { AUTH_TITLE_ID } from "./AuthLayout";
import { LoginForm } from "./LoginForm";

// Halaman Sign In (di dalam AuthLayout). User yang sudah masuk langsung diarahkan ke tujuan semula (atau Home).
export function LoginPage() {
  const session = useSession();
  const location = useLocation();

  if (session.data) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from.startsWith("/") && !from.startsWith("//") ? from : "/"} replace />;
  }

  return <LoginForm titleId={AUTH_TITLE_ID} />;
}
