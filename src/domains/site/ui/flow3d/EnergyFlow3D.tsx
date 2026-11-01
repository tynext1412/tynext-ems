import { Environment, Lightformer, Line, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import type { PlantType, WeatherSnapshot } from "@/domains/plant/domain/plant";
import { WEATHER_LABEL } from "@/domains/plant/domain/weather";
import { WeatherGlyph } from "@/domains/plant/ui/WeatherIcon";
import { connectorFor, describeFlow, FLOW_NODE_COLOR, FLOW_NODE_LABEL, FLOW_NODES } from "@/domains/site/domain/flow-connectors";
import { toTuple, type Vec3 } from "@/domains/site/domain/flow-geometry";
import { busLabelAnchor, cablePath, framingPoints, labelAnchor, SITE_SCENES } from "@/domains/site/domain/flow-scenes";
import { WEATHER_FX } from "@/domains/site/domain/weather-fx";
import type { PowerSnapshot } from "@/domains/telemetry/domain/power-snapshot";
import { formatNumber } from "@/shared/domain/units";
import { useTheme } from "@/shared/lib/theme";
import { SCENE_PALETTE } from "@/shared/ui/three/scene-palette";
import { FitCamera } from "./FitCamera";
import { FlowCable } from "./FlowCable";
import { LabelProjector } from "./LabelProjector";
import { NodeLabel } from "./NodeLabel";
import { SceneBuilder } from "./SceneBuilder";
import { WeatherEffects } from "./WeatherEffects";

export interface EnergyFlow3DProps {
  snapshot: PowerSnapshot | null | undefined;
  hasBattery: boolean;
  batteryUnits: number;
  plantType: PlantType;
  loadCapacityKW: number; // acuan terang jendela bangunan beban
  weather?: WeatherSnapshot; // cuaca plant saat ini: efek di diorama, cahaya, dan chip cuaca
}

// Kamera sedikit dari kanan-depan dan dari atas, seperti melihat diorama di meja.
const VIEW_DIRECTION: Vec3 = [0.16, 0.36, 1];

// Adegan 3D aliran energi: diorama per jenis site dari konfigurasi, kabel dari tiap sumber/beban
// ke busbar AC (selalu terlihat; yang aktif beranimasi), label di atas objek dengan garis penunjuk.
// Dimuat lazy (three.js).
// Kilatan petir: cahaya ambien putih-biru yang menyala sesaat mengikuti flashRef.
function LightningFlash({ flashRef }: { flashRef: React.RefObject<number> }) {
  const light = useRef<import("three").AmbientLight>(null);
  useFrame(() => {
    if (light.current) light.current.intensity = flashRef.current * 2.4;
  });
  return <ambientLight ref={light} color="#dfe8ff" intensity={0} />;
}

export default function EnergyFlow3D({ snapshot, hasBattery, batteryUnits, plantType, loadCapacityKW, weather }: EnergyFlow3DProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const theme = useTheme();
  const pal = SCENE_PALETTE[theme];
  const config = SITE_SCENES[plantType];
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [fit, setFit] = useState<{ center: Vec3; distance: number } | null>(null);
  const onFit = useCallback((next: { center: Vec3; distance: number }) => setFit(next), []);

  const targets = useMemo<Record<string, Vec3>>(() => {
    const t: Record<string, Vec3> = { bus: busLabelAnchor(config) };
    for (const node of FLOW_NODES) t[node] = labelAnchor(config, node);
    return t;
  }, [config]);
  const framing = useMemo(() => framingPoints(config, FLOW_NODES), [config]);
  const condition = weather?.condition ?? "CLEAR";
  const fx = WEATHER_FX[condition];
  const flashRef = useRef(0);
  const loadLevel = snapshot && loadCapacityKW > 0 ? Math.min(1, Math.max(0, snapshot.loadKW / loadCapacityKW)) : 0;

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg" role="img" aria-label={`${snapshot ? describeFlow(snapshot, hasBattery) : "Waiting for power data"}${weather ? `; weather ${WEATHER_LABEL[condition].toLowerCase()} ${weather.temperatureC}°C` : ""}`}>
      {/* Langit tipis sesuai cuaca di belakang kanvas (kanvas transparan). */}
      <div className="pointer-events-none absolute inset-0" style={{ background: `linear-gradient(180deg, ${fx.sky[0]} 0%, ${fx.sky[1]} 70%)` }} aria-hidden />
      <Canvas key={plantType} shadows="soft" dpr={[1, 1.75]} camera={{ fov: 32, near: 0.1, far: 200 }} gl={{ antialias: true, alpha: true, powerPreference: "low-power", toneMappingExposure: 1.05 }} frameloop={reducedMotion ? "demand" : "always"}>
        <ambientLight intensity={pal.ambient * fx.light.ambient} />
        <hemisphereLight args={[pal.skyLight, pal.groundLight, 0.45]} />
        <directionalLight
          position={[6, 12, 7]}
          intensity={pal.sun * fx.light.sun}
          color={fx.light.tint}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
          shadow-camera-near={1}
          shadow-camera-far={30}
          shadow-bias={-0.0003}
          shadow-normalBias={0.02}
        />
        {/* Peta lingkungan dari panel cahaya lokal (tanpa unduhan HDR) untuk pantulan logam dan kaca. */}
        <Environment resolution={64} environmentIntensity={pal.environment}>
          <Lightformer intensity={2} position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 12, 1]} />
          <Lightformer intensity={1.2} position={[-8, 3, 4]} rotation={[0, Math.PI / 2, 0]} scale={[10, 4, 1]} />
          <Lightformer intensity={0.8} position={[8, 3, -4]} rotation={[0, -Math.PI / 2, 0]} scale={[10, 4, 1]} />
        </Environment>

        <WeatherEffects condition={condition} stage={config.stage} animate={!reducedMotion} flashRef={flashRef} />
        {fx.lightning && <LightningFlash flashRef={flashRef} />}

        <SceneBuilder config={config} hasBattery={hasBattery} batteryUnits={batteryUnits} loadLevel={loadLevel} theme={theme} />

        {FLOW_NODES.map((node) => {
          const conn = snapshot ? connectorFor(node, snapshot, hasBattery) : undefined;
          return <FlowCable key={node} points={cablePath(config, node)} color={FLOW_NODE_COLOR[node]} kw={conn?.kw ?? 0} direction={conn?.direction ?? "none"} animate={!reducedMotion} idleColor={pal.cableIdle} />;
        })}

        {/* Garis penunjuk dari puncak objek ke label supaya label tidak menutupi modelnya. */}
        {FLOW_NODES.map((node) => {
          const n = config.nodes[node];
          if (node === "battery" && !hasBattery) return null;
          return <Line key={node} points={[[n.x, n.top + 0.05, n.z], toTuple(targets[node])]} color={pal.leader} lineWidth={1} transparent opacity={0.8} />;
        })}
        <Line points={[[targets.bus[0], config.bus.height + 0.08, config.bus.z], toTuple(targets.bus)]} color={pal.leader} lineWidth={1} transparent opacity={0.8} />

        <FitCamera points={framing} direction={VIEW_DIRECTION} onFit={onFit} />
        <LabelProjector targets={targets} refs={labelRefs} />
        <OrbitControls
          makeDefault
          target={fit ? toTuple(fit.center) : undefined}
          minDistance={fit ? fit.distance * 0.55 : 1}
          maxDistance={fit ? fit.distance * 1.6 : 100}
          enableZoom
          zoomSpeed={0.9}
          enablePan={false}
          enableDamping
          minPolarAngle={0.35}
          maxPolarAngle={1.3}
        />
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
          className="absolute left-0 top-0 whitespace-nowrap rounded-md border border-border bg-surface/90 px-1.5 py-0.5 text-[10px] font-medium leading-tight text-muted will-change-transform"
        >
          AC bus
        </div>
      </div>
      {weather && (
        <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-surface/85 px-2.5 py-1 text-xs text-text shadow-surface backdrop-blur-sm">
          <WeatherGlyph condition={condition} className="size-4" />
          <span>{WEATHER_LABEL[condition]}</span>
          <span className="font-mono text-muted">{weather.temperatureC}°C</span>
        </div>
      )}
    </div>
  );
}
