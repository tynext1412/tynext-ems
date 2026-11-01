import { RoundedBox } from "@react-three/drei";
// Bentuk dasar adegan: kotak/silinder/kerucut berbahan standar, lalu objek EMS (array PV, bank
// baterai, genset, tiang grid + trafo, busbar AC), model beban per jenis site, dan dekorasi.
import type { Tuple3 } from "@/domains/site/domain/flow-geometry";

interface ShapeProps {
  position: Tuple3;
  color: string;
  rotation?: Tuple3;
  emissive?: string;
  emissiveIntensity?: number;
  roughness?: number;
  metalness?: number;
  flatShading?: boolean;
}

function Material({ color, emissive, emissiveIntensity = 0.5, roughness = 0.8, metalness = 0.05, flatShading }: Omit<ShapeProps, "position" | "rotation">) {
  return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? emissiveIntensity : 0} flatShading={flatShading} />;
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

// ---- Panggung diorama ----

// Platform berbatas bersudut membulat: sisi lebih gelap dari permukaan, jadi adegan terbaca sebagai satu diorama.
export function Stage({ width, depth, top, side }: { width: number; depth: number; top: string; side: string }) {
  return (
    <group>
      <RoundedBox args={[width, 0.42, depth]} radius={0.2} smoothness={4} position={[0, -0.21, 0]} receiveShadow>
        <meshStandardMaterial color={side} roughness={0.95} />
      </RoundedBox>
      <RoundedBox args={[width - 0.16, 0.04, depth - 0.16]} radius={0.02} smoothness={2} position={[0, -0.005, 0]} receiveShadow>
        <meshStandardMaterial color={top} roughness={1} />
      </RoundedBox>
    </group>
  );
}

// Pad beton tipis di bawah peralatan supaya terlihat terpasang di lokasi.
export function ConcretePad({ position, size, color = "#d3d5d8" }: { position: [number, number]; size: [number, number]; color?: string }) {
  return (
    <mesh position={[position[0], 0.025, position[1]]} receiveShadow>
      <boxGeometry args={[size[0], 0.05, size[1]]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

// Jalan setapak / jalan lingkungan: strip sedikit lebih gelap dari permukaan dengan garis tengah putus-putus.
export function Walkway({ x, z, w, d, color = "#c9ccc4" }: { x: number; z: number; w: number; d: number; color?: string }) {
  const alongZ = d > w;
  const length = alongZ ? d : w;
  const dashes = Math.floor(length / 0.9);
  return (
    <group position={[x, 0.006, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      {Math.min(w, d) >= 0.9 &&
        Array.from({ length: dashes }, (_, i) => {
          const t = -length / 2 + 0.45 + i * 0.9;
          return (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={alongZ ? [0, 0.002, t] : [t, 0.002, 0]}>
              <planeGeometry args={alongZ ? [0.06, 0.4] : [0.4, 0.06]} />
              <meshStandardMaterial color="#f4f4f1" roughness={1} />
            </mesh>
          );
        })}
    </group>
  );
}

// ---- Peralatan EMS ----

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
        <group key={i} position={[x, baseY, z]} rotation={[-0.55, 0, 0]}>
          <Box position={[0, 0, 0]} size={[1.05, 0.04, 0.82]} color="#c9ced3" roughness={0.4} metalness={0.6} />
          <Box position={[0, 0.025, 0]} size={[0.99, 0.012, 0.76]} color="#1d3557" roughness={0.18} metalness={0.55} />
        </group>
      ))}
      {legs.map(([x, z], i) => (
        <Cylinder key={i} position={[x, baseY / 2, z]} radiusTop={0.05} radiusBottom={0.06} height={baseY} color="#7b8086" metalness={0.5} roughness={0.5} />
      ))}
      {elevated && <Box position={[0, baseY - 0.12, 0]} size={[w + 0.2, 0.06, d + 0.2]} color="#4a4e52" metalness={0.4} roughness={0.5} />}
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
          <group key={i} position={[x, 0.05, 0]}>
            <Box position={[0, 0.5, 0]} size={[0.9, 1, 0.7]} color="#e4e7ea" roughness={0.45} metalness={0.15} />
            <Box position={[0, 0.5, 0.355]} size={[0.02, 0.9, 0.01]} color="#b9bec4" />
            <Box position={[-0.22, 0.72, 0.36]} size={[0.06, 0.24, 0.01]} color="#3fb995" emissive="#3fb995" emissiveIntensity={0.9} />
            <Box position={[0, 1.04, 0]} size={[0.92, 0.06, 0.72]} color="#9aa0a6" />
          </group>
        );
      })}
    </group>
  );
}

export function Genset({ position }: { position: Tuple3 }) {
  return (
    <group position={position}>
      <Box position={[0, 0.1, 0]} size={[1.9, 0.1, 1.1]} color="#2f3336" />
      <Box position={[0, 0.6, 0]} size={[1.7, 0.9, 0.9]} color="#c39a35" roughness={0.55} metalness={0.2} />
      {[-0.5, -0.3, -0.1].map((x) => (
        <Box key={x} position={[x, 0.65, 0.455]} size={[0.12, 0.5, 0.01]} color="#8f7026" />
      ))}
      <Box position={[0.86, 0.6, 0]} size={[0.04, 0.6, 0.6]} color="#3a3e42" />
      <Cylinder position={[-0.5, 1.3, -0.2]} radiusTop={0.06} radiusBottom={0.06} height={0.5} color="#5d6166" metalness={0.5} />
    </group>
  );
}

// Tiang grid + trafo tiang di kakinya.
export function GridTower({ position }: { position: Tuple3 }) {
  return (
    <group position={position}>
      <Cylinder position={[0, 1.85, 0]} radiusTop={0.07} radiusBottom={0.12} height={3.6} color="#8c9196" metalness={0.4} roughness={0.5} />
      <Box position={[0, 2.65, 0]} size={[1.6, 0.08, 0.08]} color="#8c9196" metalness={0.4} />
      <Box position={[0, 3.25, 0]} size={[1.1, 0.08, 0.08]} color="#8c9196" metalness={0.4} />
      {[-0.7, 0.7].map((x) => (
        <Cylinder key={x} position={[x, 2.5, 0]} radiusTop={0.05} radiusBottom={0.05} height={0.25} color="#d8dbde" />
      ))}
      {[-0.45, 0.45].map((x) => (
        <Cylinder key={x} position={[x, 3.1, 0]} radiusTop={0.05} radiusBottom={0.05} height={0.25} color="#d8dbde" />
      ))}
      <Box position={[0.75, 0.47, 0.25]} size={[0.6, 0.8, 0.5]} color="#6d7277" roughness={0.5} metalness={0.3} />
      {[0.6, 0.75, 0.9].map((x) => (
        <Cylinder key={x} position={[x, 0.95, 0.25]} radiusTop={0.03} radiusBottom={0.04} height={0.18} color="#d8dbde" />
      ))}
    </group>
  );
}

// Busbar AC: batang konduktor di atas dua tiang isolator, tempat semua kabel bertemu, plus panel
// switchgear di sebelahnya. Strip tipis di batang menyala warna aksen.
export function Busbar({ position, length, height }: { position: Tuple3; length: number; height: number }) {
  return (
    <group position={position}>
      {[-length / 2 + 0.1, length / 2 - 0.1].map((x) => (
        <group key={x}>
          <Cylinder position={[x, (height - 0.1) / 2 + 0.05, 0]} radiusTop={0.05} radiusBottom={0.07} height={height - 0.1} color="#7b8086" metalness={0.5} roughness={0.45} />
          <Cylinder position={[x, height - 0.08, 0]} radiusTop={0.07} radiusBottom={0.07} height={0.1} color="#e8e1d2" segments={10} />
        </group>
      ))}
      <Box position={[0, height, 0]} size={[length, 0.09, 0.14]} color="#b98a57" roughness={0.35} metalness={0.8} />
      <Box position={[0, height + 0.052, 0]} size={[length - 0.1, 0.012, 0.05]} color="#4cb3d4" emissive="#4cb3d4" emissiveIntensity={1.1} />
      <group position={[-length / 2 - 0.75, 0, 0]}>
        <Box position={[0, 0.55, 0]} size={[0.9, 1.0, 0.6]} color="#3a4046" roughness={0.45} metalness={0.35} />
        {[-0.2, 0.2].map((x) => (
          <Box key={x} position={[x, 0.55, 0.305]} size={[0.36, 0.86, 0.01]} color="#2b3035" />
        ))}
        <Box position={[0, 0.9, 0.31]} size={[0.5, 0.05, 0.01]} color="#4cb3d4" emissive="#4cb3d4" emissiveIntensity={0.9} />
      </group>
    </group>
  );
}

// ---- Model beban per jenis site ----

const WINDOW_OFF = "#3d4b57";
const WINDOW_GLOW = "#ffd27a";

function Window({ position, size, level }: { position: Tuple3; size: [number, number]; level: number }) {
  return <Box position={position} size={[size[0], size[1], 0.02]} color={level > 0.02 ? "#f5e3b8" : WINDOW_OFF} emissive={WINDOW_GLOW} emissiveIntensity={0.15 + level * 1.1} roughness={0.3} />;
}

// Atap pelana dengan overhang di semua sisi.
function GableRoof({ width, depth, height, color, y }: { width: number; depth: number; height: number; color: string; y: number }) {
  const slope = Math.atan2(height, depth / 2);
  const slab = Math.hypot(height, depth / 2) + 0.25;
  return (
    <group position={[0, y, 0]}>
      <Box position={[0, height / 2, -depth / 4 - 0.06]} rotation={[slope, 0, 0]} size={[width + 0.5, 0.08, slab]} color={color} roughness={0.6} metalness={0.25} />
      <Box position={[0, height / 2, depth / 4 + 0.06]} rotation={[-slope, 0, 0]} size={[width + 0.5, 0.08, slab]} color={color} roughness={0.6} metalness={0.25} />
    </group>
  );
}

// Pabrik pengolahan: atap pelana ber-overhang, deret jendela yang makin terang saat beban tinggi,
// pintu rolling, cerobong, dan ruang annex.
export function Factory({ position, level, padColor }: { position: Tuple3; level: number; padColor?: string }) {
  const w = 4.2;
  const h = 1.9;
  const d = 2.0;
  return (
    <group position={position}>
      <ConcretePad position={[0, 0.2]} size={[w + 0.9, d + 1.3]} color={padColor} />
      <Box position={[0, 0.05 + h / 2, 0]} size={[w, h, d]} color="#e3e1db" roughness={0.85} />
      <Box position={[0, 0.12, 0]} size={[w + 0.04, 0.14, d + 0.04]} color="#9aa0a6" />
      <GableRoof width={w} depth={d} height={0.6} color="#5d6b78" y={h + 0.05} />
      {[-1.55, -0.95, 0.95, 1.55].map((x) => (
        <Window key={x} position={[x, 1.35, d / 2 + 0.01]} size={[0.42, 0.42]} level={level} />
      ))}
      <group position={[0, 0.05, d / 2 + 0.012]}>
        <Box position={[0, 0.62, 0]} size={[1.1, 1.24, 0.02]} color="#9ea4aa" metalness={0.5} roughness={0.4} />
        {Array.from({ length: 8 }, (_, i) => (
          <Box key={i} position={[0, 0.12 + i * 0.15, 0.012]} size={[1.1, 0.012, 0.01]} color="#7f868d" />
        ))}
        <Box position={[0, 1.3, 0.01]} size={[1.24, 0.1, 0.05]} color="#5d6b78" />
      </group>
      <Cylinder position={[1.5, h + 1.0, -0.5]} radiusTop={0.12} radiusBottom={0.16} height={2.2} color="#8d9399" metalness={0.4} roughness={0.5} />
      <Box position={[-w / 2 - 0.55, 0.55, 0.2]} size={[1.0, 1.0, 1.2]} color="#d2d0c9" />
      <Box position={[-w / 2 - 0.55, 1.08, 0.2]} size={[1.15, 0.06, 1.35]} color="#5d6b78" />
    </group>
  );
}

// Hotel/resort: gedung utama berbalkon dan sayap kecil, jendela menyala sesuai beban.
export function Resort({ position, level, padColor = "#e4ddd0" }: { position: Tuple3; level: number; padColor?: string }) {
  return (
    <group position={position}>
      <ConcretePad position={[0, 0.3]} size={[5.6, 3.2]} color={padColor} />
      <Box position={[0, 1.05, 0]} size={[3.6, 2.0, 1.6]} color="#f1ece2" roughness={0.9} />
      <Box position={[0, 2.12, 0]} size={[3.95, 0.14, 1.95]} color="#8a5a3c" roughness={0.7} />
      {[0.7, 1.45].map((y) =>
        [-1.3, -0.65, 0, 0.65, 1.3].map((x) => <Window key={`${x}${y}`} position={[x, y, 0.81]} size={[0.32, 0.36]} level={level} />),
      )}
      {[0.55, 1.3].map((y) => (
        <Box key={y} position={[0, y, 0.9]} size={[3.6, 0.04, 0.18]} color="#cfc7b8" />
      ))}
      <group position={[2.55, 0, 0.4]}>
        <Box position={[0, 0.7, 0]} size={[1.5, 1.3, 1.3]} color="#ece6da" />
        <Box position={[0, 1.42, 0]} size={[1.75, 0.12, 1.55]} color="#8a5a3c" />
        <Window position={[-0.3, 0.75, 0.66]} size={[0.32, 0.36]} level={level} />
        <Window position={[0.3, 0.75, 0.66]} size={[0.32, 0.36]} level={level} />
      </group>
    </group>
  );
}

// Pabrik pengolahan tambang: gedung proses, dua silo, dan konveyor ke stockpile.
export function ProcessingPlant({ position, level, padColor }: { position: Tuple3; level: number; padColor?: string }) {
  return (
    <group position={position}>
      <ConcretePad position={[0.4, 0.2]} size={[6.0, 3.0]} color={padColor} />
      <Box position={[-0.4, 1.15, 0]} size={[3.0, 2.2, 1.7]} color="#a3a8ad" roughness={0.6} metalness={0.25} />
      <Box position={[-0.4, 2.3, 0]} size={[3.3, 0.1, 2.0]} color="#5a5f64" />
      {[-1.3, -0.4, 0.5].map((x) => (
        <Window key={x} position={[x, 1.6, 0.86]} size={[0.5, 0.3]} level={level} />
      ))}
      <Box position={[-0.4, 0.6, 0.86]} size={[1.0, 1.1, 0.02]} color="#7e858b" metalness={0.5} />
      <Silo position={[1.9, 0, -0.3]} />
      <Silo position={[2.85, 0, -0.3]} radius={0.38} height={1.9} />
    </group>
  );
}

// ---- Pohon ----

// Palem dengan pelepah kusam; dipakai di resort (jumlahnya sedikit, jadi tidak perlu instancing).
export function PalmTree({ position, height = 1.8, rotation = 0 }: { position: Tuple3; height?: number; rotation?: number }) {
  const fronds = 7;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <Cylinder position={[0, height / 2, 0]} rotation={[0, 0, 0.06]} radiusTop={0.06} radiusBottom={0.1} height={height} color="#7a6146" segments={8} />
      {Array.from({ length: fronds }, (_, i) => (
        <group key={i} position={[0.05, height, 0]} rotation={[0, (i / fronds) * Math.PI * 2, -0.5]}>
          <Box position={[0.42, 0, 0]} size={[0.85, 0.03, 0.2]} color={i % 2 ? "#6b8f5e" : "#5e7d55"} roughness={0.9} flatShading />
        </group>
      ))}
    </group>
  );
}

export function Pool({ position, size }: { position: Tuple3; size: [number, number] }) {
  return (
    <group position={position}>
      <Box position={[0, 0.04, 0]} size={[size[0] + 0.3, 0.08, size[1] + 0.3]} color="#d6cfc0" />
      <Box position={[0, 0.085, 0]} size={[size[0], 0.02, size[1]]} color="#4fb3d9" emissive="#1b6f99" emissiveIntensity={0.25} roughness={0.08} metalness={0.1} />
    </group>
  );
}

// ---- Dekor tambang ----
export function Terraces({ position, scale = 1 }: { position: Tuple3; scale?: number }) {
  const tiers: Array<[number, string]> = [
    [3.0, "#8a7660"],
    [2.3, "#957f68"],
    [1.6, "#a08a72"],
    [0.9, "#ab957c"],
  ];
  return (
    <group position={position} scale={scale}>
      {tiers.map(([r, c], i) => (
        <Cylinder key={i} position={[0, 0.225 + i * 0.45, 0]} radiusTop={r * 0.9} radiusBottom={r} height={0.45} color={c} segments={9} flatShading roughness={1} />
      ))}
    </group>
  );
}

export function Stockpile({ position, radius, height }: { position: Tuple3; radius: number; height: number }) {
  return <Cone position={[position[0], position[1] + height / 2, position[2]]} radius={radius} height={height} segments={9} color="#7d6a57" roughness={1} flatShading />;
}

export function HaulTruck({ position, rotation }: { position: Tuple3; rotation?: Tuple3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 0.55, 0]} size={[1.6, 0.3, 0.8]} color="#3a3e42" />
      <Box position={[-0.5, 0.95, 0]} size={[0.5, 0.45, 0.75]} color="#d9a441" roughness={0.5} />
      <Box position={[0.3, 1.02, 0]} size={[1.0, 0.55, 0.85]} color="#c9962f" rotation={[0, 0, 0.08]} roughness={0.5} />
      {([-0.5, 0.5] as const).map((x) =>
        ([-0.45, 0.45] as const).map((z) => <Cylinder key={`${x}${z}`} position={[x, 0.3, z]} rotation={[Math.PI / 2, 0, 0]} radiusTop={0.3} radiusBottom={0.3} height={0.2} color="#1c1f22" />),
      )}
    </group>
  );
}

export function Excavator({ position, rotation }: { position: Tuple3; rotation?: Tuple3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Box position={[0, 0.25, 0]} size={[1.3, 0.3, 1.0]} color="#2f3336" />
      <Box position={[0, 0.7, 0]} size={[1.1, 0.6, 0.9]} color="#d9a441" roughness={0.5} />
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
      <Cylinder position={[0, height / 2 + 0.05, 0]} radiusTop={radius} radiusBottom={radius} height={height} color="#b4b9be" roughness={0.35} metalness={0.6} segments={20} />
      <Cone position={[0, height + 0.25, 0]} radius={radius} height={0.4} color="#8d9399" metalness={0.5} />
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

export function WaterTank({ position }: { position: Tuple3 }) {
  return (
    <group position={position}>
      {([-0.3, 0.3] as const).map((x) =>
        ([-0.3, 0.3] as const).map((z) => <Cylinder key={`${x}${z}`} position={[x, 0.65, z]} radiusTop={0.04} radiusBottom={0.04} height={1.2} color="#7b8086" metalness={0.5} />),
      )}
      <Cylinder position={[0, 1.65, 0]} radiusTop={0.5} radiusBottom={0.5} height={0.8} color="#d6dade" roughness={0.35} metalness={0.5} segments={20} />
      <Cone position={[0, 2.18, 0]} radius={0.52} height={0.25} color="#a9aeb3" metalness={0.4} />
    </group>
  );
}
