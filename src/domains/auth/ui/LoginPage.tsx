import { Navigate, useLocation } from "react-router-dom";
import { Brand } from "@/shared/ui/Brand";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { useSession } from "../application/use-auth";
import { LoginForm } from "./LoginForm";
import { CrossingCables } from "./scene/CrossingCables";
import { LoginIllustration } from "./scene/LoginIllustration";

// Halaman masuk: ilustrasi vektor site (PV, baterai, inverter, meter, teknisi, aliran listrik)
// memenuhi latar; kartu form di kanan bertepi lengkung dan kabel bergaris menyeberang ke
// dalamnya supaya keduanya menyatu. Di ponsel ilustrasi di atas, form di bawah.
export function LoginPage() {
  const session = useSession();
  const location = useLocation();

  if (session.data) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from.startsWith("/") ? from : "/"} replace />;
  }

  return (
    <main className="login-sky h-dvh overflow-y-auto">
      <div className="relative min-h-full lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(400px,520px)]">
        {/* Kolom ilustrasi: gambar utuh rata bawah; langit adalah latar halaman sehingga menyambung ke kartu */}
        <div className="relative h-72 lg:h-auto lg:min-h-dvh">
          <LoginIllustration className="absolute inset-0 h-full w-full" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 py-5">
            <Brand size="md" />
            <ThemeToggle />
          </div>
          <div className="pointer-events-none absolute left-6 top-24 hidden max-w-md lg:block">
            <h2 className="text-2xl font-semibold leading-tight">Energy control untuk semua site Anda</h2>
            <p className="mt-2 text-sm text-muted">PV, baterai, inverter, dan meter dalam satu dashboard: pantau aliran daya, alarm, dan jadwal O&amp;M dari mana saja.</p>
          </div>
        </div>

        <section aria-labelledby="login-title" className="relative z-10 -mt-6 rounded-t-3xl bg-surface px-6 pb-10 pt-8 lg:mt-0 lg:flex lg:flex-col lg:justify-center lg:rounded-none lg:rounded-l-[56px] lg:px-16 lg:py-12 lg:shadow-[-24px_0_48px_rgba(27,29,31,0.08)]">
          <CrossingCables />
          <div className="mx-auto w-full max-w-sm">
            <h1 id="login-title" className="text-3xl font-semibold tracking-tight">
              Masuk
            </h1>
            <p className="mt-1 mb-7 text-sm text-muted">Tynext EMS · pemantauan PV &amp; BESS multi-site</p>
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
