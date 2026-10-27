import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
// Bentuk dasar adegan: kotak/silinder/kerucut berbahan standar, lalu objek EMS
// (array PV, bank baterai, genset, tiang grid, switchgear) dan dekor per jenis site.
import type { Tuple3 } from "@/domains/site/domain/flow-geometry";

interface ShapeProps {
  position: Tuple3;
  color: string;
  rotation?: Tuple3;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
}

function Material({ color, emissive, emissiveIntensity = 0.5, roughness = 0.85, metalness = 0.05 }: Omit<ShapeProps, "position" | "rotation">) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? emissiveIntensity : 0} />;
}

export function Box({ position, rotation, size, ...mat }: ShapeProps & { size: Tuple3 }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={size} />
      <Material {...mat} />
    </mesh>
  );
}

export function Cylinder({ position, rotation, radiusTop, radiusBottom, height, segments = 16, ...mat }: ShapeProps & { radiusTop: number; radiusBottom: number; height: number; segments?: number }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <cylinderGeometry args={[radiusTop, radiusBottom, height, segments]} />
      <Material {...mat} />
    </mesh>
  );
}

export function Cone({ position, rotation, radius, height, segments = 20, ...mat }: ShapeProps & { radius: number; height: number; segments?: number }) {
  return (
    <mesh position={position} rotation={rotation} castShadow receiveShadow>
      <coneGeometry args={[radius, height, segments]} />
      <Material {...mat} />
    </mesh>
  );
}

// Tanah abu-abu terang luas + pelataran site yang sedikit lebih gelap.
export function Ground({ color = "#e9ecef", padColor = "#dfe3e7" }: { color?: string; padColor?: string }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1.5]} receiveShadow>
        <planeGeometry args={[17, 15]} />
        <meshStandardMaterial color={padColor} roughness={1} />
      </mesh>
    </group>
  );
}

export function Pad({ position, size, color }: { position: Tuple3; size: [number, number]; color: string }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

// Array PV miring menghadap kamera; `elevated` = kanopi parkir (resort).
export function PvArray({ position, rows, cols, elevated = false }: { position: Tuple3; rows: number; cols: number; elevated?: boolean }) {
  const pitchX = 1.15;
  const pitchZ = 0.95;
  const baseY = elevated ? 1.6 : 0.45;
  const w = cols * pitchX;
  const d = rows * pitchZ;
  const panels: Array<[number, number]> = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) panels.push([-w / 2 + pitchX / 2 + c * pitchX, -d / 2 + pitchZ / 2 + r * pitchZ]);
  const legs: Array<[number, number]> = [
    [-w / 2 + 0.3, -d / 2 + 0.2],
    [w / 2 - 0.3, -d / 2 + 0.2],
    [-w / 2 + 0.3, d / 2 - 0.2],
    [w / 2 - 0.3, d / 2 - 0.2],
  ];
  return (
    <group position={position}>
      {panels.map(([x, z], i) => (
        <group key={i} position={[x, baseY, z]} rotation={[-0.35, 0, 0]}>
          <Box position={[0, 0, 0]} size={[1.05, 0.04, 0.82]} color="#1a2f4f" roughness={0.35} metalness={0.4} />
          <Box position={[0, 0.03, 0]} size={[0.98, 0.01, 0.74]} color="#2b5c93" roughness={0.25} metalness={0.5} />
        </group>
      ))}
      {legs.map(([x, z], i) => (
        <Cylinder key={i} position={[x, baseY / 2, z]} radiusTop={0.05} radiusBottom={0.06} height={baseY} color="#6b7075" />
      ))}
      {elevated && <Box position={[0, baseY - 0.12, 0]} size={[w + 0.2, 0.06, d + 0.2]} color="#4a4e52" />}
    </group>
  );
}

export function BatteryBank({ position, units }: { position: Tuple3; units: number }) {
  const n = Math.min(3, Math.max(1, units));
  return (
    <group position={position}>
      {Array.from({ length: n }, (_, i) => {
        const x = (i - (n - 1) / 2) * 1.0;
        return (
          <group key={i} position={[x, 0, 0]}>
            <Box position={[0, 0.5, 0]} size={[0.9, 1, 0.7]} color="#d9dde0" roughness={0.6} />
            <Box position={[0, 0.5, 0.36]} size={[0.9, 0.12, 0.02]} color="#3fb995" emissive="#3fb995" emissiveIntensity={0.5} />
            <Box position={[0, 1.05, 0]} size={[0.5, 0.1, 0.4]} color="#8c9196" />
          </group>
        );
      })}
    </group>
  );
}

export function Genset({ position }: { position: Tuple3 }) {
  return (
    <group position={position}>
      <Box position={[0, 0.05, 0]} size={[1.9, 0.1, 1.1]} color="#2f3336" />
      <Box position={[0, 0.5, 0]} size={[1.7, 0.9, 0.9]} color="#b7902c" roughness={0.7} />
      <Box position={[0.86, 0.5, 0]} size={[0.04, 0.6, 0.6]} color="#3a3e42" />
      <Cylinder position={[-0.5, 1.2, -0.2]} radiusTop={0.06} radiusBottom={0.06} height={0.5} color="#5d6166" />
    </group>
  );
}

export function GridTower({ position }: { position: Tuple3 }) {
  return (
    <group position={position}>
      <Box position={[0, 0.03, 0]} size={[1.4, 0.06, 1]} color="#2f3336" />
      <Cylinder position={[0, 1.8, 0]} radiusTop={0.07} radiusBottom={0.12} height={3.6} color="#8c9196" />
      <Box position={[0, 2.6, 0]} size={[1.6, 0.08, 0.08]} color="#8c9196" />
      <Box position={[0, 3.2, 0]} size={[1.1, 0.08, 0.08]} color="#8c9196" />
      {[-0.7, 0.7].map((x) => (
        <Cylinder key={x} position={[x, 2.45, 0]} radiusTop={0.05} radiusBottom={0.05} height={0.25} color="#cfd3d6" />
      ))}
      {[-0.45, 0.45].map((x) => (
        <Cylinder key={x} position={[x, 3.05, 0]} radiusTop={0.05} radiusBottom={0.05} height={0.25} color="#cfd3d6" />
      ))}
      <Box position={[0.9, 0.42, 0.3]} size={[0.6, 0.8, 0.5]} color="#5b5f63" roughness={0.6} />
    </group>
  );
}

// Switchgear = bus AC: semua kabel bertemu di sini; strip atasnya menyala warna aksen.
export function Switchgear({ position }: { position: Tuple3 }) {
  return (
    <group position={position}>
      <Box position={[0, 0.3, 0]} size={[1.4, 0.6, 0.9]} color="#2b2f33" roughness={0.5} metalness={0.3} />
      <Box position={[0, 0.62, 0]} size={[1.3, 0.04, 0.12]} color="#4cb3d4" emissive="#4cb3d4" emissiveIntensity={0.9} />
      {[-0.4, 0, 0.4].map((x) => (
        <Box key={x} position={[x, 0.3, 0.46]} size={[0.28, 0.4, 0.02]} color="#1b1d1f" />
      ))}
    </group>
  );
}

// ---- Dekor resort ----
export function Building({ position, size, color, roofColor = "#5a4634", windows = 4 }: { position: Tuple3; size: Tuple3; color: string; roofColor?: string; windows?: number }) {
  const [w, h, d] = size;
  return (
    <group position={position}>
      <Box position={[0, h / 2, 0]} size={[w, h, d]} color={color} roughness={0.9} />
      <Box position={[0, h + 0.06, 0]} size={[w + 0.3, 0.12, d + 0.3]} color={roofColor} />
      {Array.from({ length: windows }, (_, i) => (
        <Box key={i} position={[-w / 2 + (w / (windows + 1)) * (i + 1), h * 0.55, d / 2 + 0.01]} size={[0.28, 0.32, 0.02]} color="#f2d58a" emissive="#f2c56a" emissiveIntensity={0.7} />
      ))}
    </group>
  );
}

export function PalmTree({ position, height = 1.8 }: { position: Tuple3; height?: number }) {
  const fronds = 6;
  return (
    <group position={position}>
      <Cylinder position={[0, height / 2, 0]} radiusTop={0.06} radiusBottom={0.1} height={height} color="#6b4f2a" />
      {Array.from({ length: fronds }, (_, i) => (
        <group key={i} position={[0, height, 0]} rotation={[0, (i / fronds) * Math.PI * 2, -0.45]}>
          <Box position={[0.45, 0, 0]} size={[0.9, 0.04, 0.22]} color="#2f7d4f" />
        </group>
      ))}
    </group>
  );
}

export function Pool({ position, size }: { position: Tuple3; size: [number, number] }) {
  return (
    <group position={position}>
      <Box position={[0, 0.04, 0]} size={[size[0] + 0.3, 0.08, size[1] + 0.3]} color="#c9c3b5" />
      <Box position={[0, 0.09, 0]} size={[size[0], 0.04, size[1]]} color="#2a9fd6" emissive="#1b6f99" emissiveIntensity={0.5} roughness={0.2} metalness={0.1} />
    </group>
  );
}

// ---- Dekor tambang ----
export function Terraces({ position }: { position: Tuple3 }) {
  const tiers: Array<[number, string]> = [
    [3.0, "#5f4d3a"],
    [2.3, "#6b5744"],
    [1.6, "#77634f"],
    [0.9, "#846f58"],
  ];
  return (
    <group position={position}>
      {tiers.map(([r, c], i) => (
        <Cylinder key={i} position={[0, 0.225 + i * 0.45, 0]} radiusTop={r * 0.9} radiusBottom={r} height={0.45} color={c} segments={28} />
      ))}
    </group>
  );
}

export function HaulTruck({ position, rotation }: { position: Tuple3; rotation?: Tuple3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 0.55, 0]} size={[1.6, 0.3, 0.8]} color="#3a3e42" />
      <Box position={[-0.5, 0.95, 0]} size={[0.5, 0.45, 0.75]} color="#d9a441" />
      <Box position={[0.3, 1.02, 0]} size={[1.0, 0.55, 0.85]} color="#c9962f" rotation={[0, 0, 0.08]} />
      {([-0.5, 0.5] as const).map((x) =>
        ([-0.45, 0.45] as const).map((z) => <Cylinder key={`${x}${z}`} position={[x, 0.3, z]} rotation={[Math.PI / 2, 0, 0]} radiusTop={0.3} radiusBottom={0.3} height={0.2} color="#111315" />),
      )}
    </group>
  );
}

export function Excavator({ position, rotation }: { position: Tuple3; rotation?: Tuple3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 0.25, 0]} size={[1.3, 0.3, 1.0]} color="#2f3336" />
      <Box position={[0, 0.7, 0]} size={[1.1, 0.6, 0.9]} color="#d9a441" />
      <group position={[0.5, 0.9, 0]} rotation={[0, 0, 0.55]}>
        <Box position={[0.8, 0, 0]} size={[1.6, 0.18, 0.18]} color="#c9962f" />
        <group position={[1.6, 0, 0]} rotation={[0, 0, -1.3]}>
          <Box position={[0.55, 0, 0]} size={[1.1, 0.14, 0.14]} color="#c9962f" />
          <Box position={[1.1, -0.1, 0]} size={[0.35, 0.35, 0.4]} color="#5d6166" />
        </group>
      </group>
    </group>
  );
}

export function Silo({ position, radius = 0.45, height = 2.2 }: { position: Tuple3; radius?: number; height?: number }) {
  return (
    <group position={position}>
      <Cylinder position={[0, height / 2, 0]} radiusTop={radius} radiusBottom={radius} height={height} color="#9a9ea3" roughness={0.5} metalness={0.3} segments={20} />
      <Cone position={[0, height + 0.2, 0]} radius={radius} height={0.4} color="#7d8186" />
    </group>
  );
}

export function Conveyor({ position, length = 3.2, angle = 0.32, rotation }: { position: Tuple3; length?: number; angle?: number; rotation?: Tuple3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 0.9, 0]} rotation={[0, 0, angle]} size={[length, 0.12, 0.5]} color="#4a4e52" />
      <Cylinder position={[-length * 0.4, 0.3, 0]} radiusTop={0.05} radiusBottom={0.05} height={0.6} color="#6b7075" />
      <Cylinder position={[length * 0.4, 0.75, 0]} radiusTop={0.05} radiusBottom={0.05} height={1.5} color="#6b7075" />
    </group>
  );
}

// ---- Dekor perkebunan ----
export function CropRows({ position, rows, cols, spacing = 0.7, color = "#3f8a3f", soil = "#cdbc9f" }: { position: Tuple3; rows: number; cols: number; spacing?: number; color?: string; soil?: string }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const count = rows * cols;
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    let i = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const s = 0.8 + ((r * 7 + c * 3) % 5) * 0.07; // variasi tinggi tanaman, deterministik
        o.position.set(-((cols - 1) * spacing) / 2 + c * spacing, 0.3 * s, -((rows - 1) * spacing) / 2 + r * spacing);
        o.scale.set(s, s, s);
        o.updateMatrix();
        mesh.setMatrixAt(i++, o.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [rows, cols, spacing]);
  return (
    <group position={position}>
      <Pad position={[0, 0.012, 0]} size={[cols * spacing + 0.5, rows * spacing + 0.5]} color={soil} />
      <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow receiveShadow>
        <coneGeometry args={[0.26, 0.6, 7]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

export function Mill({ position }: { position: Tuple3 }) {
  return (
    <group position={position}>
      <Building position={[0, 0, 0]} size={[2.8, 1.6, 1.5]} color="#b9bcc0" roofColor="#5c6166" windows={3} />
      <Cylinder position={[1.1, 1.8, -0.4]} radiusTop={0.14} radiusBottom={0.18} height={2.6} color="#7d8186" />
      <Box position={[-1.9, 0.4, 0.2]} size={[0.9, 0.8, 0.9]} color="#9a9ea3" />
    </group>
  );
}

export function WaterTank({ position }: { position: Tuple3 }) {
  return (
    <group position={position}>
      {([-0.3, 0.3] as const).map((x) =>
        ([-0.3, 0.3] as const).map((z) => <Cylinder key={`${x}${z}`} position={[x, 0.6, z]} radiusTop={0.04} radiusBottom={0.04} height={1.2} color="#6b7075" />),
      )}
      <Cylinder position={[0, 1.6, 0]} radiusTop={0.5} radiusBottom={0.5} height={0.8} color="#cfd3d6" roughness={0.5} metalness={0.3} segments={20} />
    </group>
  );
}
