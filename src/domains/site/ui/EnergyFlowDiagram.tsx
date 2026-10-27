import { connectorFor, describeFlow } from "@/domains/site/domain/flow-connectors";
import type { FlowNode } from "@/domains/telemetry/domain/energy-flow";
import type { PowerSnapshot } from "@/domains/telemetry/domain/power-snapshot";
import { formatNumber } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";

interface Props {
  snapshot: PowerSnapshot | null | undefined;
  hasBattery: boolean;
  className?: string;
}

const W = 600;
const H = 320;
const BUS_Y = 160;
const NODE_W = 120;
const NODE_H = 60;
const EPSILON = 0.05;

interface NodeSpec {
  id: FlowNode | "bus";
  label: string;
  x: number; // pusat
  y: number; // pusat
  side: "top" | "bottom";
}

// Diagram satu garis ala EMS: sumber di atas bus AC, beban dan baterai di bawah.
// Garis putus-putus bergerak hanya pada konektor yang mengalirkan daya, searah
// alirannya; itu satu-satunya gerak di diagram dan dimatikan oleh prefers-reduced-motion.
const NODES: NodeSpec[] = [
  { id: "pv", label: "PV", x: 150, y: 50, side: "top" },
  { id: "genset", label: "Genset", x: 300, y: 50, side: "top" },
  { id: "grid", label: "Grid", x: 450, y: 50, side: "top" },
  { id: "load", label: "Load", x: 225, y: 270, side: "bottom" },
  { id: "battery", label: "Battery", x: 375, y: 270, side: "bottom" },
];

export function EnergyFlowDiagram({ snapshot, hasBattery, className }: Props) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label={snapshot ? describeFlow(snapshot, hasBattery) : "Menunggu data daya"}
    >
      {/* Bus AC */}
      <line x1={60} y1={BUS_Y} x2={W - 60} y2={BUS_Y} stroke="var(--color-border)" strokeWidth={4} strokeLinecap="round" />
      <text x={W - 60} y={BUS_Y - 10} textAnchor="end" fontSize="10" className="fill-muted">
        AC bus
      </text>

      {NODES.map((node) => {
        const conn = snapshot ? connectorFor(node.id as FlowNode, snapshot, hasBattery) : undefined;
        const active = conn !== undefined && conn.direction !== "none";
        const nodeEdgeY = node.side === "top" ? node.y + NODE_H / 2 : node.y - NODE_H / 2;
        // Path selalu digambar dari node ke bus; arah animasi dibalik bila aliran dari bus ke node.
        const path = `M ${node.x} ${nodeEdgeY} L ${node.x} ${BUS_Y}`;
        const reverse = conn?.direction === "from-bus";
        const labelY = (nodeEdgeY + BUS_Y) / 2;

        return (
          <g key={node.id}>
            <path d={path} stroke="var(--color-border)" strokeWidth={2} fill="none" />
            {active && <path d={path} className={cn("flow-line", reverse && "is-reverse")} stroke="var(--color-accent)" strokeWidth={3} fill="none" />}

            {conn && conn.kw > EPSILON && (
              <text x={node.x + 8} y={labelY + 4} fontSize="11" className="fill-text font-mono">
                {formatNumber(conn.kw, 1)} kW
              </text>
            )}

            <rect
              x={node.x - NODE_W / 2}
              y={node.y - NODE_H / 2}
              width={NODE_W}
              height={NODE_H}
              rx={6}
              fill="var(--color-surface-2)"
              stroke={active ? "var(--color-accent)" : "var(--color-border)"}
              strokeWidth={1.5}
            />
            <text x={node.x} y={node.y - 10} textAnchor="middle" fontSize="11" className="fill-muted">
              {node.label}
            </text>
            <text x={node.x} y={node.y + 10} textAnchor="middle" fontSize="16" fontWeight={600} className={cn("font-mono", active ? "fill-text" : "fill-muted")}>
              {conn ? `${formatNumber(conn.kw, 1)} kW` : "…"}
            </text>
            {conn?.caption && (
              <text x={node.x} y={node.y + 24} textAnchor="middle" fontSize="9" className="fill-muted">
                {conn.caption}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
