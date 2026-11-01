import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh } from "three";
import type { FlowDirection } from "@/domains/site/domain/flow-connectors";
import { particleCount, particleSpeed, pointAt, polylineLength, toTuple, type Vec3 } from "@/domains/site/domain/flow-geometry";

interface Props {
  points: Vec3[];
  color: string;
  kw: number;
  direction: FlowDirection;
  animate: boolean;
  idleColor?: string;
}

// Kabel dari node ke busbar. Selalu digambar supaya arsitektur sistem terbaca: tanpa daya = garis
// abu-abu tipis putus-putus tanpa animasi; mengalirkan daya = garis berwarna node yang lebih tebal
// dengan partikel bergerak searah aliran (jumlah dan kecepatannya mengikuti besar daya).
export function FlowCable({ points, color, kw, direction, animate, idleColor = "#b5bcc3" }: Props) {
  const active = direction !== "none";
  const count = active ? particleCount(kw) : 0;
  const speed = particleSpeed(kw);
  const length = useMemo(() => polylineLength(points), [points]);
  const linePoints = useMemo(() => points.map(toTuple), [points]);
  const refs = useRef<Array<Mesh | null>>([]);
  const progress = useRef(0);

  useFrame((_, delta) => {
    if (!animate || count === 0 || length === 0) return;
    progress.current = (progress.current + (speed * delta) / length) % 1;
    for (let i = 0; i < count; i++) {
      const mesh = refs.current[i];
      if (!mesh) continue;
      let t = (progress.current + i / count) % 1;
      if (direction === "from-bus") t = 1 - t;
      const p = pointAt(points, t);
      mesh.position.set(p[0], p[1], p[2]);
    }
  });

  return (
    <group>
      {active ? (
        <Line points={linePoints} color={color} lineWidth={3} />
      ) : (
        <Line points={linePoints} color={idleColor} lineWidth={1.6} dashed dashSize={0.18} gapSize={0.12} />
      )}
      {Array.from({ length: count }, (_, i) => {
        const p = pointAt(points, direction === "from-bus" ? 1 - i / count : i / count);
        return (
          <mesh
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            position={toTuple(p)}
          >
            <sphereGeometry args={[0.09, 10, 10]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}
