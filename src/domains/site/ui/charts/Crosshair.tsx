import type { HoverPoint } from "./useCrosshair";

interface Scale {
  (value: number): number;
  invert?: (pixel: number) => number;
}

// Bagian props yang diberikan recharts ke <Customized component={…}>.
export interface CustomizedProps {
  offset?: { left: number; top: number; width: number; height: number };
  xAxisMap?: Record<string, { scale: Scale }>;
  yAxisMap?: Record<string, { scale: Scale }>;
}

interface CrosshairProps extends CustomizedProps {
  hover: HoverPoint | null;
  formatX: (x: number) => string;
  formatY: (y: number) => string;
  color?: string;
  yAxisId?: string; // sumbu untuk label kiri; default sumbu pertama
  // Grafik dua sumbu: label kedua di kanan area plot, dibaca dari sumbu ini.
  right?: { axisId: string; format: (y: number) => string };
}

const TAG_H = 18;

// Garis bantu horizontal + vertikal di posisi kursor, dengan label nilai di sumbu Y (kiri)
// dan label waktu di sumbu X (bawah). Nilai Y dibaca dari skala sumbu, jadi sesuai posisi kursor.
export function Crosshair({ offset, xAxisMap, yAxisMap, hover, formatX, formatY, color = "#f5a524", yAxisId, right }: CrosshairProps) {
  if (!hover || !offset) return null;
  const xScale = xAxisMap ? Object.values(xAxisMap)[0]?.scale : undefined;
  const yScale = yAxisMap ? (yAxisId !== undefined ? yAxisMap[yAxisId] : Object.values(yAxisMap)[0])?.scale : undefined;
  const rightScale = right && yAxisMap?.[right.axisId]?.scale;
  if (!xScale || !yScale?.invert) return null;

  const { left, top, width, height } = offset;
  const y = Math.min(top + height, Math.max(top, hover.y));
  const x = xScale(hover.x);
  if (!Number.isFinite(x) || x < left - 0.5 || x > left + width + 0.5) return null;
  const yLabel = formatY(yScale.invert(y));
  const xLabel = formatX(hover.x);
  const yTagW = Math.max(30, yLabel.length * 6.6 + 10);
  const xTagW = Math.max(38, xLabel.length * 6.6 + 12);
  const rightLabel = right && rightScale?.invert ? right.format(rightScale.invert(y)) : undefined;
  const rightTagW = rightLabel ? Math.max(30, rightLabel.length * 6.6 + 10) : 0;
  const xTagX = Math.min(left + width - xTagW, Math.max(left, x - xTagW / 2));

  return (
    <g pointerEvents="none" aria-hidden>
      <line x1={left} x2={left + width} y1={y} y2={y} stroke={color} strokeWidth={1} strokeDasharray="4 3" />
      <line x1={x} x2={x} y1={top} y2={top + height} stroke={color} strokeWidth={1} strokeDasharray="4 3" />
      <rect x={left - yTagW - 2} y={y - TAG_H / 2} width={yTagW} height={TAG_H} rx={4} fill={color} />
      <text x={left - yTagW / 2 - 2} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="#1b1d1f" style={{ fontVariantNumeric: "tabular-nums" }}>
        {yLabel}
      </text>
      {rightLabel && (
        <>
          <rect x={left + width + 2} y={y - TAG_H / 2} width={rightTagW} height={TAG_H} rx={4} fill={color} />
          <text x={left + width + 2 + rightTagW / 2} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="#1b1d1f" style={{ fontVariantNumeric: "tabular-nums" }}>
            {rightLabel}
          </text>
        </>
      )}
      <rect x={xTagX} y={top + height + 3} width={xTagW} height={TAG_H} rx={4} fill={color} />
      <text x={xTagX + xTagW / 2} y={top + height + 16} textAnchor="middle" fontSize={11} fontWeight={600} fill="#1b1d1f" style={{ fontVariantNumeric: "tabular-nums" }}>
        {xLabel}
      </text>
    </g>
  );
}
