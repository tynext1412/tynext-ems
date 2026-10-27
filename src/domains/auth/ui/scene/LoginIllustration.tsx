import { useReducedMotion } from "framer-motion";
import { cn } from "@/shared/lib/cn";

// Ilustrasi vektor halaman login: site PV + inverter + baterai + meter + tiang grid, tiga
// teknisi yang bekerja, dan listrik yang mengalir di kabel. Animasi lewat CSS (kelas
// .login-art di index.css) dan partikel SMIL; keduanya berhenti saat reduced motion.
const COLOR = { pv: "#d95926", battery: "#199e70", grid: "#3987e5", load: "#d55181", accent: "#4cb3d4", teal: "#3fb995" };

const CABLES = [
  { id: "art-pv", d: "M 335 445 L 575 445 L 575 425", color: COLOR.pv, dur: "3.4s" },
  { id: "art-bat", d: "M 640 405 L 745 405", color: COLOR.battery, dur: "2.6s" },
  { id: "art-load", d: "M 605 425 L 605 505 L 570 505", color: COLOR.load, dur: "2.8s" },
  { id: "art-grid", d: "M 545 540 L 905 540 L 905 300", color: COLOR.grid, dur: "4.6s" },
] as const;

interface PersonProps {
  x: number;
  y: number;
  vest: string;
  helmet: string;
  flip?: boolean;
  bodyClass?: string;
  armClass?: string;
  tool?: "brush" | "tablet" | "panel";
}

function Person({ x, y, vest, helmet, flip, bodyClass, armClass, tool }: PersonProps) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <g className={bodyClass}>
        <ellipse cx={0} cy={112} rx={22} ry={5} fill="#1b1d1f" opacity={0.12} />
        <rect x={-13} y={70} width={11} height={40} rx={4} fill="#3b4a66" />
        <rect x={2} y={70} width={11} height={40} rx={4} fill="#3b4a66" />
        <rect x={-18} y={22} width={36} height={52} rx={8} fill={vest} />
        <rect x={-18} y={38} width={36} height={6} fill="#ffffff" opacity={0.85} />
        <rect x={-27} y={26} width={9} height={34} rx={4} fill={vest} />
        <circle cx={0} cy={6} r={14} fill="#d9a37a" />
        <path d="M-17 4 a17 17 0 0 1 34 0 Z" fill={helmet} />
        <rect x={-19} y={2} width={38} height={4} rx={2} fill={helmet} />
        <g className={armClass} style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}>
          <rect x={18} y={24} width={9} height={36} rx={4} fill={vest} />
          {tool === "brush" && (
            <>
              <line x1={22} y1={58} x2={56} y2={74} stroke="#8c9196" strokeWidth={4} strokeLinecap="round" />
              <rect x={52} y={68} width={20} height={11} rx={2} fill={COLOR.teal} />
            </>
          )}
          {tool === "tablet" && <rect x={14} y={50} width={24} height={16} rx={2} fill="#2b2f33" />}
          {tool === "panel" && <rect x={6} y={20} width={14} height={78} rx={3} fill="#1a2f4f" stroke="#2b5c93" strokeWidth={2} />}
        </g>
      </g>
    </g>
  );
}

function Panel({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) skewY(-9)`}>
      <rect width={110} height={56} rx={3} fill="#1a2f4f" />
      <g stroke="#2b5c93" strokeWidth={2}>
        {[27, 55, 82].map((cx) => (
          <line key={cx} x1={cx} y1={0} x2={cx} y2={56} />
        ))}
        <line x1={0} y1={28} x2={110} y2={28} />
      </g>
      <rect width={110} height={56} rx={3} fill="none" stroke="#9aa0a6" strokeWidth={2} />
    </g>
  );
}

export function LoginIllustration({ className }: { className?: string }) {
  const reduced = useReducedMotion() ?? false;
  return (
    <svg className={cn("login-art", className)} viewBox="0 0 1000 700" preserveAspectRatio="xMidYMax meet" aria-hidden>
      <defs>
        <linearGradient id="art-screen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4cb3d4" />
          <stop offset="1" stopColor="#184c7f" />
        </linearGradient>
      </defs>

      {/* Matahari dan awan; langit = latar halaman */}
      <g transform="translate(820 110)">
        <circle r={78} fill="#f2c200" opacity={0.14} />
        <g className="sun-rays" stroke="#f2c200" strokeWidth={4} strokeLinecap="round" opacity={0.7}>
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={0} y1={-58} x2={0} y2={-70} transform={`rotate(${i * 30})`} />
          ))}
        </g>
        <circle r={44} fill="#f2c200" />
      </g>
      <g transform="translate(140 120)">
        <g className="cloud cloud-fill">
          <circle cx={0} cy={0} r={22} />
          <circle cx={26} cy={-8} r={28} />
          <circle cx={56} cy={2} r={20} />
          <rect x={-10} y={0} width={76} height={22} rx={11} />
        </g>
      </g>
      <g transform="translate(520 70)">
        <g className="cloud slow cloud-fill">
          <circle cx={0} cy={0} r={16} />
          <circle cx={22} cy={-6} r={20} />
          <circle cx={46} cy={2} r={14} />
          <rect x={-8} y={0} width={60} height={16} rx={8} />
        </g>
      </g>

      {/* Tanah: dua bukit + garis terrain */}
      <path className="hill-far" d="M0 500 C 180 440 380 470 560 480 S 860 470 1000 430 L1000 700 L0 700Z" />
      <path className="hill-near" d="M0 560 C 260 520 620 575 1000 520 L1000 700 L0 700Z" />
      <g stroke="var(--color-border)" strokeWidth={1}>
        {[590, 620, 650, 680].map((y) => (
          <line key={y} x1={0} y1={y} x2={1000} y2={y + 12 - (y - 590) / 2} />
        ))}
      </g>

      {/* Tiang grid + kawat ke kanan (menyambung ke belakang kartu form) */}
      <g transform="translate(905 180)">
        <rect x={-6} y={0} width={12} height={360} rx={3} fill="#8c9196" />
        <rect x={-54} y={38} width={108} height={8} rx={3} fill="#8c9196" />
        <rect x={-36} y={78} width={72} height={8} rx={3} fill="#8c9196" />
        {[-44, 44].map((x) => (
          <rect key={x} x={x - 4} y={26} width={8} height={14} rx={2} fill="#cfd3d6" />
        ))}
        <path d="M 44 30 C 200 70, 320 60, 420 20" fill="none" stroke="#9aa0a6" strokeWidth={2} />
        <path d="M -44 30 C -140 90, -200 120, -240 160" fill="none" stroke="#9aa0a6" strokeWidth={2} />
        <g className="bolt" transform="translate(0 -30)">
          <polygon points="-8,-22 8,-22 1,-4 12,-4 -6,22 -1,2 -12,2" fill="#f2c200" />
        </g>
      </g>

      {/* Array PV (2 baris × 4) di atas kaki */}
      <g>
        {[0, 1].map((r) =>
          [0, 1, 2, 3].map((c) => (
            <g key={`${r}${c}`}>
              <line x1={118 + c * 112 + r * 36} y1={338 + r * 88 + c * -18 + 56} x2={118 + c * 112 + r * 36} y2={400 + r * 88 + c * -18 + 50} stroke="#6b7075" strokeWidth={5} strokeLinecap="round" />
              <Panel x={90 + c * 112 + r * 36} y={338 + r * 88 + c * -18} />
            </g>
          )),
        )}
      </g>

      {/* Inverter dengan layar menyala dan LED kedip */}
      <g transform="translate(575 305)">
        <rect x={-40} y={0} width={80} height={125} rx={6} fill="#d9dde0" stroke="#b5bcc3" strokeWidth={2} />
        <rect x={-28} y={14} width={56} height={34} rx={3} fill="url(#art-screen)" />
        <polyline points="-22,38 -12,28 -2,34 8,20 18,30 24,24" fill="none" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" />
        <circle className="led" cx={28} cy={60} r={4} fill="#5ad46a" />
        {[-26, -8, 10].map((x) => (
          <rect key={x} x={x} y={70} width={14} height={42} rx={2} fill="#8c9196" />
        ))}
        <text x={0} y={122} textAnchor="middle" fontSize={9} fill="var(--color-muted)" fontFamily="IBM Plex Mono, monospace">
          INVERTER
        </text>
      </g>
      {/* Percikan listrik di atas inverter */}
      <g transform="translate(575 290)">
        {[-26, -12, 0, 12, 26, -6, 8].map((x, i) => (
          <circle key={i} className="spark" cx={x} cy={0} r={i % 2 ? 3 : 4} fill={COLOR.accent} style={{ animationDelay: `${(i * 0.37) % 2.4}s` }} />
        ))}
      </g>

      {/* Bank baterai dengan bar isi daya */}
      <g transform="translate(745 350)">
        {[0, 70].map((x) => (
          <g key={x} transform={`translate(${x} 0)`}>
            <rect x={0} y={0} width={62} height={84} rx={5} fill="#d9dde0" stroke="#b5bcc3" strokeWidth={2} />
            <rect x={6} y={8} width={50} height={14} rx={3} fill="#eceef0" />
            <rect className="charge" x={6} y={8} width={50} height={14} rx={3} fill={COLOR.teal} />
            <rect x={0} y={32} width={62} height={6} fill={COLOR.teal} />
            <rect x={14} y={48} width={34} height={24} rx={3} fill="#8c9196" />
          </g>
        ))}
        <text x={66} y={98} textAnchor="middle" fontSize={9} fill="var(--color-muted)" fontFamily="IBM Plex Mono, monospace">
          BATTERY
        </text>
      </g>

      {/* Meter di tiang pendek dengan jarum */}
      <g transform="translate(545 470)">
        <rect x={-4} y={60} width={8} height={70} rx={3} fill="#6b7075" />
        <rect x={-26} y={0} width={52} height={64} rx={5} fill="#cfd3d6" stroke="#b5bcc3" strokeWidth={2} />
        <circle cx={0} cy={26} r={17} fill="#f6f7f8" stroke="#8c9196" strokeWidth={2} />
        <g className="needle" style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}>
          <rect x={-1.5} y={11} width={3} height={15} rx={1} fill="#c62828" />
        </g>
        <rect x={-18} y={48} width={36} height={8} rx={2} fill="#8c9196" />
        <text x={0} y={76} textAnchor="middle" fontSize={9} fill="var(--color-muted)" fontFamily="IBM Plex Mono, monospace">
          METER
        </text>
      </g>

      {/* Kabel bergaris + partikel listrik */}
      {CABLES.map((c) => (
        <g key={c.id}>
          <path id={c.id} d={c.d} fill="none" stroke="#c9cfd5" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <path d={c.d} fill="none" stroke={c.color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" className={reduced ? undefined : "flow-line"} />
          {!reduced &&
            [0, 1, 2].map((i) => (
              <circle key={i} r={5} fill={c.color}>
                <animateMotion dur={c.dur} repeatCount="indefinite" begin={`-${(i * parseFloat(c.dur)) / 3}s`}>
                  <mpath href={`#${c.id}`} />
                </animateMotion>
              </circle>
            ))}
        </g>
      ))}

      {/* Teknisi: menyapu panel, memeriksa tablet, mengangkut modul (berjalan) */}
      <Person x={470} y={330} vest="#f28c28" helmet="#f2c200" flip armClass="arm-sweep" tool="brush" />
      <Person x={668} y={330} vest="#f2c200" helmet="#ffffff" flip bodyClass="bob" tool="tablet" />
      <g transform="translate(60 470)">
        <g className="walk">
          <Person x={0} y={0} vest="#f28c28" helmet="#f2c200" bodyClass="bob" tool="panel" />
        </g>
      </g>
    </svg>
  );
}
