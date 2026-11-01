import { Navigate, useLocation } from "react-router-dom";
import { Brand } from "@/shared/ui/Brand";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { useSession } from "../application/use-auth";
import { LoginForm } from "./LoginForm";
import { LoginVideoBackdrop } from "./LoginVideoBackdrop";

// Halaman masuk: video latar (siang/malam menurut jam lokal) memenuhi halaman; kartu form, pil logo,
// dan tombol tema tembus pandang 65 % dengan blur supaya video tetap terlihat di baliknya.
// Di ponsel video di atas, form di bawah.
export function LoginPage() {
  const session = useSession();
  const location = useLocation();

  if (session.data) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from.startsWith("/") ? from : "/"} replace />;
  }

  return (
    <main className="login-sky relative h-dvh overflow-y-auto">
      <LoginVideoBackdrop className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover" />
      {/* Scrim gelap di atas video supaya logo dan teks pembuka tetap terbaca. */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.45)_0%,rgba(0,0,0,0.15)_40%,rgba(0,0,0,0.35)_100%)]" aria-hidden />

      <div className="relative z-10 min-h-full lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(400px,520px)]">
        <div className="relative h-72 lg:h-auto lg:min-h-dvh">
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5">
            <span className="rounded-xl bg-white/65 px-3 py-1.5 backdrop-blur-md">
              <Brand size="md" />
            </span>
            <ThemeToggle className="border-white/40 bg-surface/65 backdrop-blur-md" />
          </div>
          <div className="pointer-events-none absolute left-6 top-24 hidden max-w-md text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] lg:block">
            <h2 className="text-2xl font-semibold leading-tight">Energy control for all your sites</h2>
            <p className="mt-2 text-sm text-white/85">PV, batteries, inverters, and meters in one dashboard: monitor power flow, alarms, and O&amp;M schedules from anywhere.</p>
          </div>
        </div>

        <section aria-labelledby="login-title" className="relative -mt-6 rounded-t-3xl bg-surface/65 px-6 pb-10 pt-8 backdrop-blur-md lg:mt-0 lg:flex lg:flex-col lg:justify-center lg:rounded-none lg:rounded-l-[56px] lg:px-16 lg:py-12 lg:shadow-[-24px_0_48px_rgba(0,0,0,0.18)]">
          <div className="mx-auto w-full max-w-sm">
            <h1 id="login-title" className="text-3xl font-semibold tracking-tight">
              Sign in
            </h1>
            <p className="mt-1 mb-7 text-sm text-muted">Tynext EMS · multi-site PV &amp; BESS monitoring</p>
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
