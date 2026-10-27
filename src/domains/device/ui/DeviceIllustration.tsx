import type { DeviceKind } from "../domain/device";

// Ilustrasi vektor per tipe perangkat; dipakai bila foto produk (photoUrl) belum tersedia.
export function DeviceIllustration({ kind, className }: { kind: DeviceKind; className?: string }) {
  return (
    <svg viewBox="0 0 160 180" className={className} role="img" aria-label={`Ilustrasi ${kind.toLowerCase()}`}>
      {kind === "INVERTER" && <Inverter />}
      {kind === "BATTERY" && <Battery />}
      {kind === "PCS" && <Pcs />}
      {kind === "METER" && <Meter />}
    </svg>
  );
}

const body = { fill: "var(--color-surface)", stroke: "var(--color-border)", strokeWidth: 2 };
const dark = { fill: "var(--color-surface-2)", stroke: "var(--color-border)", strokeWidth: 1.5 };

function Inverter() {
  return (
    <g>
      <rect x={30} y={18} width={100} height={110} rx={10} {...body} />
      <rect x={44} y={34} width={72} height={30} rx={4} fill="#0d2a3a" />
      <polyline points="50,56 60,46 70,52 80,38 90,48 100,42 108,50" fill="none" stroke="#4cb3d4" strokeWidth={2} strokeLinecap="round" />
      <circle cx={48} cy={78} r={3} fill="var(--color-ok)" />
      <circle cx={60} cy={78} r={3} fill="var(--color-border)" />
      <circle cx={72} cy={78} r={3} fill="var(--color-border)" />
      <rect x={44} y={90} width={72} height={6} rx={2} {...dark} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={36 + i * 13} y={128} width={9} height={30} rx={1} {...dark} />
      ))}
      {[52, 80, 108].map((x) => (
        <rect key={x} x={x - 5} y={158} width={10} height={14} rx={3} fill="var(--color-muted)" />
      ))}
    </g>
  );
}

function Battery() {
  return (
    <g>
      <rect x={34} y={10} width={92} height={162} rx={8} {...body} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i} transform={`translate(0 ${22 + i * 28})`}>
          <rect x={44} y={0} width={72} height={22} rx={3} {...dark} />
          <circle cx={54} cy={11} r={2.5} fill="var(--color-ok)" />
          <rect x={64} y={8} width={32} height={6} rx={2} fill="#3fb995" opacity={0.85} />
          <rect x={102} y={5} width={8} height={12} rx={1} fill="var(--color-muted)" />
        </g>
      ))}
      <rect x={44} y={162} width={72} height={4} rx={2} fill="var(--color-border)" />
    </g>
  );
}

function Pcs() {
  return (
    <g>
      <rect x={28} y={12} width={104} height={160} rx={8} {...body} />
      <rect x={40} y={24} width={80} height={44} rx={4} fill="#0d2a3a" />
      <g stroke="#4cb3d4" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d="M54 38 H96" />
        <path d="M88 31 L96 38 L88 45" />
        <path d="M106 54 H64" />
        <path d="M72 47 L64 54 L72 61" />
      </g>
      <text x={80} y={88} textAnchor="middle" fontSize={10} fontWeight={600} fill="var(--color-muted)" fontFamily="IBM Plex Mono, monospace">
        AC ⇄ DC
      </text>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={40} y={98 + i * 11} width={80} height={5} rx={2} {...dark} />
      ))}
      <circle cx={48} cy={166} r={0} />
      <rect x={40} y={160} width={30} height={6} rx={2} fill="var(--color-border)" />
      <rect x={90} y={160} width={30} height={6} rx={2} fill="var(--color-border)" />
    </g>
  );
}

function Meter() {
  return (
    <g>
      <rect x={30} y={24} width={100} height={132} rx={8} {...body} />
      <rect x={42} y={38} width={76} height={40} rx={4} fill="#dfe6df" stroke="var(--color-border)" strokeWidth={1.5} />
      <text x={80} y={64} textAnchor="middle" fontSize={16} fontWeight={600} fill="#1b1d1f" fontFamily="IBM Plex Mono, monospace">
        0128.4
      </text>
      <text x={112} y={50} textAnchor="end" fontSize={7} fill="#5b6168" fontFamily="IBM Plex Mono, monospace">
        kWh
      </text>
      <circle cx={52} cy={94} r={3} fill="var(--color-ok)" />
      <circle cx={64} cy={94} r={3} fill="var(--color-warn)" />
      <rect x={42} y={106} width={76} height={14} rx={3} {...dark} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={44 + i * 11} y={132} width={8} height={16} rx={1} fill="var(--color-muted)" />
      ))}
    </g>
  );
}
