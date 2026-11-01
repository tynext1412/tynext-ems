import type { SiteSceneConfig, PropSpec } from "@/domains/site/domain/flow-scenes";
import type { Theme } from "@/shared/lib/theme";
import {
  BatteryBank,
  Busbar,
  ConcretePad,
  Conveyor,
  Excavator,
  Factory,
  Genset,
  GridTower,
  HaulTruck,
  Pool,
  ProcessingPlant,
  PvArray,
  Resort,
  Silo,
  Stage,
  Stockpile,
  Terraces,
  WaterTank,
  Walkway,
} from "@/shared/ui/three/primitives";
import { Trees } from "./Trees";

export interface SceneBuilderProps {
  config: SiteSceneConfig;
  hasBattery: boolean;
  batteryUnits: number;
  loadLevel: number; // 0..1, terang jendela bangunan beban
  theme: Theme;
}

// Di tema gelap warna panggung dicampur ke grafit (di ruang sRGB, seperti CSS) dari warna
// konfigurasi, jadi tiap site tetap punya satu sumber warna.
const DARK_BASE = [0x1b, 0x1e, 0x21];
function stageColor(hex: string, theme: Theme): string {
  if (theme !== "dark") return hex;
  const n = parseInt(hex.slice(1), 16);
  const rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return `#${rgb.map((c, i) => Math.round(DARK_BASE[i] + (c - DARK_BASE[i]) * 0.22).toString(16).padStart(2, "0")).join("")}`;
}

function Prop({ spec }: { spec: PropSpec }) {
  switch (spec.kind) {
    case "waterTower":
      return <WaterTank position={[spec.x, 0, spec.z]} />;
    case "silo":
      return <Silo position={[spec.x, 0, spec.z]} radius={spec.radius} height={spec.height} />;
    case "excavator":
      return <Excavator position={[spec.x, 0, spec.z]} rotation={[0, spec.rotation, 0]} />;
    case "haulTruck":
      return <HaulTruck position={[spec.x, 0, spec.z]} rotation={[0, spec.rotation, 0]} />;
    case "stockpile":
      return <Stockpile position={[spec.x, 0, spec.z]} radius={spec.radius} height={spec.height} />;
    case "terraces":
      return <Terraces position={[spec.x, 0, spec.z]} scale={spec.scale} />;
    case "pool":
      return <Pool position={[spec.x, 0, spec.z]} size={[spec.w, spec.d]} />;
    case "conveyor":
      return <Conveyor position={[spec.x, 0, spec.z]} rotation={[0, spec.rotation, 0]} />;
  }
}

// Satu builder untuk semua jenis site: panggung, jalan, peralatan EMS di atas pad beton, model
// beban, dekorasi, dan pohon dibaca dari konfigurasi (domain/flow-scenes.ts).
export function SceneBuilder({ config, hasBattery, batteryUnits, loadLevel, theme }: SceneBuilderProps) {
  const { nodes: N, bus } = config;
  const units = Math.min(3, Math.max(1, batteryUnits));
  const LoadModel = config.load.model === "factory" ? Factory : config.load.model === "resort" ? Resort : ProcessingPlant;
  const pvW = config.pv.cols * 1.15;
  const pvD = config.pv.rows * 0.95;
  const pad = stageColor("#d3d5d8", theme);

  return (
    <group>
      <Stage width={config.stage.w} depth={config.stage.d} top={stageColor(config.stage.top, theme)} side={stageColor(config.stage.side, theme)} />
      {config.paths.map((p, i) => (
        <Walkway key={i} {...p} color={stageColor("#c9ccc4", theme)} />
      ))}

      <LoadModel position={[N.load.x, 0, N.load.z]} level={loadLevel} padColor={pad} />

      <ConcretePad position={[N.pv.x, N.pv.z]} size={[pvW + 0.5, pvD + 0.5]} color={stageColor("#d9dbd5", theme)} />
      <PvArray position={[N.pv.x, 0.05, N.pv.z]} rows={config.pv.rows} cols={config.pv.cols} elevated={config.pv.elevated} />

      {hasBattery && (
        <>
          <ConcretePad position={[N.battery.x, N.battery.z]} size={[units * 1.0 + 0.5, 1.2]} color={pad} />
          <BatteryBank position={[N.battery.x, 0, N.battery.z]} units={units} />
        </>
      )}

      <ConcretePad position={[N.genset.x, N.genset.z]} size={[2.3, 1.5]} color={pad} />
      <Genset position={[N.genset.x, 0, N.genset.z]} />

      <ConcretePad position={[N.grid.x + 0.35, N.grid.z + 0.1]} size={[1.9, 1.4]} color={pad} />
      <group position={[N.grid.x, 0.05, N.grid.z]} scale={0.76}>
        <GridTower position={[0, 0, 0]} />
      </group>

      <ConcretePad position={[bus.x - 0.4, bus.z]} size={[bus.length + 2.1, 1.2]} color={pad} />
      <Busbar position={[bus.x, 0.05, bus.z]} length={bus.length} height={bus.height - 0.05} />

      {config.props.map((p, i) => (
        <Prop key={i} spec={p} />
      ))}
      <Trees areas={config.trees} seed={config.seed} />
    </group>
  );
}
