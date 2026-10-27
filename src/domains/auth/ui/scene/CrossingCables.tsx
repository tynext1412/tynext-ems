import { useReducedMotion } from "framer-motion";

// Dua kabel bergaris yang "menyeberang" dari ilustrasi ke kartu form, lengkap dengan
// partikel yang berjalan (SMIL animateMotion), supaya form dan gambar menyatu.
export function CrossingCables() {
  const reduced = useReducedMotion() ?? false;
  const cables = [
    { id: "cable-top", d: "M 0 86 C 70 86, 90 26, 150 26 S 230 46, 262 40", color: "#4cb3d4", y: "top-16", dur: "3.2s" },
    { id: "cable-bottom", d: "M 0 30 C 60 30, 80 92, 140 92 S 226 70, 262 78", color: "#3fb995", y: "bottom-20", dur: "4.1s" },
  ] as const;
  return (
    <>
      {cables.map((c) => (
        <svg key={c.id} className={`pointer-events-none absolute -left-28 hidden h-28 w-66 lg:block ${c.y}`} viewBox="0 0 264 112" aria-hidden>
          <path id={c.id} d={c.d} fill="none" stroke="#d5d9de" strokeWidth={3} strokeLinecap="round" />
          <path d={c.d} fill="none" stroke={c.color} strokeWidth={3} strokeLinecap="round" className={reduced ? undefined : "flow-line"} />
          <circle cx={262} cy={c.id === "cable-top" ? 40 : 78} r={6} fill={c.color} />
          <circle cx={262} cy={c.id === "cable-top" ? 40 : 78} r={2.5} fill="#ffffff" />
          {!reduced &&
            [0, 1, 2].map((i) => (
              <circle key={i} r={4} fill={c.color}>
                <animateMotion dur={c.dur} repeatCount="indefinite" begin={`-${(i * parseFloat(c.dur)) / 3}s`}>
                  <mpath href={`#${c.id}`} />
                </animateMotion>
              </circle>
            ))}
        </svg>
      ))}
    </>
  );
}
