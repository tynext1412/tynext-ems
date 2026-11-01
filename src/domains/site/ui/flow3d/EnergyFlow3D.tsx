import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useMemo, useRef, type ReactNode } from "react";
import type { PlantType } from "@/domains/plant/domain/plant";
import { connectorFor, describeFlow, FLOW_NODE_COLOR, FLOW_NODE_LABEL, FLOW_NODES } from "@/domains/site/domain/flow-connectors";
import { toTuple, type Vec3 } from "@/domains/site/domain/flow-geometry";
import { cablePath, FLOW_LAYOUTS } from "@/domains/site/domain/flow-layouts";
import type { PowerSnapshot } from "@/domains/telemetry/domain/power-snapshot";
import { formatNumber } from "@/shared/domain/units";
import { useTheme, type Theme } from "@/shared/lib/theme";
import { SCENE_PALETTE } from "@/shared/ui/three/scene-palette";
import { CameraRig } from "./CameraRig";
import { FlowCable } from "./FlowCable";
import { LabelProjector } from "./LabelProjector";
import { NodeLabel } from "./NodeLabel";
import { Ground } from "@/shared/ui/three/primitives";
import { MiningScene, PlantationScene, ResortScene, type SceneProps } from "./SiteScenes";

export interface EnergyFlow3DProps {
  snapshot: PowerSnapshot | null | undefined;
  hasBattery: boolean;
  batteryUnits: number;
  plantType: PlantType;
  overlay?: ReactNode; // kotak angka yang menumpang di sisi kanan kanvas
  insetRight?: number; // lebar overlay + margin (px) agar adegan dibingkai di area tersisa
}

const SCENE_BY_TYPE: Record<PlantType, (props: SceneProps) => React.JSX.Element> = { RESORT_HOTEL: ResortScene, MINING: MiningScene, PLANTATION: PlantationScene };
const PAD_COLOR: Record<Theme, Record<PlantType, string>> = {
  light: { RESORT_HOTEL: "#e3e7eb", MINING: "#e6e1d9", PLANTATION: "#e1e7df" },
  dark: { RESORT_HOTEL: "#26292c", MINING: "#2b2824", PLANTATION: "#262a24" },
};

// Adegan 3D aliran energi: satu adegan per jenis site, kabel dari tiap sumber/beban ke
// switchgear (bus AC) dengan partikel yang bergerak searah aliran. Dimuat lazy (three.js).
export default function EnergyFlow3D({ snapshot, hasBattery, batteryUnits, plantType, overlay, insetRight = 0 }: EnergyFlow3DProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const theme = useTheme();
  const pal = SCENE_PALETTE[theme];
  const layout = FLOW_LAYOUTS[plantType];
  const Scene = SCENE_BY_TYPE[plantType];
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const targets = useMemo<Record<string, Vec3>>(() => ({ ...layout.labels, bus: [layout.bus[0] + 1.1, layout.bus[1] + 0.55, layout.bus[2]] }), [layout]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg" role="img" aria-label={snapshot ? describeFlow(snapshot, hasBattery) : "Menunggu data daya"}>
      <Canvas
        key={plantType}
        shadows="percentage"
        dpr={[1, 1.5]}
        camera={{ position: toTuple(layout.camera.position), fov: 40, near: 0.1, far: 120 }}
        gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
        frameloop={reducedMotion ? "demand" : "always"}
      >
        <fog attach="fog" args={[pal.fog, 18, 40]} />
        <ambientLight intensity={pal.ambient} />
        <hemisphereLight args={[pal.skyLight, pal.groundLight, 0.5]} />
        <directionalLight position={[7, 11, 5]} intensity={pal.sun} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-bias={-0.0004} />

        <Ground color={pal.ground} padColor={PAD_COLOR[theme][plantType]} />
        {/* Lantai kotak-kotak halus ala terrain: sel 0,5 m, garis seksi tiap 2,5 m, memudar ke kabut. */}
        <Grid position={[0, 0.03, 0]} infiniteGrid cellSize={0.5} cellThickness={0.6} cellColor={pal.gridCell} sectionSize={2.5} sectionThickness={0.9} sectionColor={pal.gridSection} fadeDistance={34} fadeStrength={1.1} />
        <Scene layout={layout} hasBattery={hasBattery} batteryUnits={batteryUnits} palette={pal} />
        {FLOW_NODES.map((node) => {
          const conn = snapshot ? connectorFor(node, snapshot, hasBattery) : undefined;
          return <FlowCable key={node} points={cablePath(layout, node)} color={FLOW_NODE_COLOR[node]} kw={conn?.kw ?? 0} direction={conn?.direction ?? "none"} animate={!reducedMotion} idleColor={pal.cableIdle} />;
        })}
        <CameraRig position={layout.camera.position} target={layout.camera.target} insetRight={insetRight} />
        <LabelProjector targets={targets} refs={labelRefs} />
        <OrbitControls makeDefault enableZoom zoomSpeed={0.9} minDistance={6} maxDistance={40} enablePan={false} enableDamping minPolarAngle={0.45} maxPolarAngle={1.25} />
      </Canvas>

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {FLOW_NODES.map((node) => {
          const conn = snapshot ? connectorFor(node, snapshot, hasBattery) : undefined;
          return (
            <NodeLabel
              key={node}
              ref={(el) => {
                labelRefs.current[node] = el;
              }}
              label={FLOW_NODE_LABEL[node]}
              value={conn ? `${formatNumber(conn.kw, 1)} kW` : "…"}
              caption={conn?.caption}
              color={FLOW_NODE_COLOR[node]}
              active={conn !== undefined && conn.direction !== "none"}
            />
          );
        })}
        <div
          ref={(el) => {
            labelRefs.current.bus = el;
          }}
          className="absolute left-0 top-0 whitespace-nowrap text-[10px] text-muted will-change-transform"
        >
          AC bus
        </div>
      </div>
      {overlay && <div className="absolute right-4 top-1/2 z-20 grid w-48 -translate-y-1/2 gap-2">{overlay}</div>}
    </div>
  );
}
