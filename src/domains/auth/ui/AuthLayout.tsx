import { Link, Outlet } from "react-router-dom";
import logo from "@/assets/figma/logo/tynext-logo-color.svg";
import { useForcedTheme } from "@/shared/lib/theme";
import { LoginVideoBackdrop } from "./LoginVideoBackdrop";

const FEATURES = ["Solar PV", "Battery Storage", "Alarms", "O&M Schedule"];

// Kerangka halaman Sign In dan Forgot Password (Figma "Authentication · Login & Forgot Password"):
// video latar existing satu layar, scrim gelap dari bawah, headline + chip fitur di kiri bawah,
// dan panel putih 480 px di kanan (jarak 12 px dari tepi, radius 24) berisi logo, form, dan
// copyright. Desain ini hanya punya mode terang. Di bawah 1024 px headline disembunyikan dan
// panel berada di tengah. Dipakai sebagai layout route, jadi video tidak dimuat ulang saat
// berpindah antara Sign In dan langkah-langkah Forgot Password.
export const AUTH_TITLE_ID = "auth-title"; // judul (h1) halaman yang sedang tampil

export function AuthLayout() {
  useForcedTheme("light");

  return (
    <main className="relative h-dvh overflow-y-auto bg-[linear-gradient(180deg,#6f9fcf_0%,#1d3a50_100%)]">
      <LoginVideoBackdrop className="pointer-events-none fixed inset-0 z-0 h-full w-full object-cover" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(0deg,rgba(5,15,26,0.78)_0%,rgba(5,15,26,0.25)_50%,rgba(0,0,0,0)_75%)]" aria-hidden />

      <div className="relative z-10 flex min-h-full p-3 lg:justify-end">
        <section
          aria-labelledby={AUTH_TITLE_ID}
          className="mx-auto flex min-h-[calc(100dvh-24px)] w-full max-w-[480px] flex-col rounded-3xl bg-surface px-6 pb-7 pt-10 shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:px-10 lg:mx-0 lg:w-[480px]"
        >
          <Link to="/login" aria-label="Tynext Energy and Control, go to Sign In" className="self-start rounded-md">
            <img src={logo} alt="" width={129} height={32} className="h-8 w-[129px]" />
          </Link>
          <div className="mt-10">
            <Outlet />
          </div>
          <p className="mt-auto pt-10 text-xs leading-[18px] text-[#a1a1aa]">© {new Date().getFullYear()} Tynext Energy and Control</p>
        </section>
      </div>

      <div className="pointer-events-none fixed bottom-14 left-14 z-10 hidden w-[min(520px,calc(100vw-492px-96px))] flex-col gap-5 text-white lg:flex">
        <ul className="flex flex-wrap gap-2" aria-label="Features">
          {FEATURES.map((f) => (
            <li key={f} className="rounded-full border border-white/32 bg-white/16 px-3 py-1.5 text-[13px] font-medium leading-5 backdrop-blur-[6px]">
              {f}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3">
          <h2 className="text-[44px] font-semibold leading-[52px] tracking-[-0.6px]">Monitor Every Plant From One Dashboard</h2>
          <p className="max-w-[510px] text-lg leading-7 text-white/88">See solar output, battery health, alarms, and maintenance for all your sites in one place.</p>
        </div>
      </div>
    </main>
  );
}
