import { Billboard, Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { WeatherCondition } from "@/domains/plant/domain/plant";
import { FLASH_DURATION, flashLevel, lightningBolt, nextFlashDelay, WEATHER_FX } from "@/domains/site/domain/weather-fx";

interface Props {
  condition: WeatherCondition;
  stage: { w: number; d: number };
  animate: boolean;
  // Kilatan petir dipantulkan ke cahaya adegan lewat ref ini (0 = gelap, 1 = puncak kilat).
  flashRef?: React.RefObject<number>;
}

// PRNG kecil supaya posisi awan dan hujan stabil antar render.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ---- Matahari: cakram bercahaya dengan sinar yang berputar pelan, selalu menghadap kamera ----
function Sun({ animate }: { animate: boolean }) {
  const rays = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (animate && rays.current) rays.current.rotation.z += delta * 0.15;
  });
  return (
    <Billboard position={[6.8, 5.4, -5.5]}>
      <mesh>
        <circleGeometry args={[0.55, 32]} />
        <meshBasicMaterial color="#ffd45e" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <circleGeometry args={[0.85, 32]} />
        <meshBasicMaterial color="#ffe7a3" transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <group ref={rays}>
        {Array.from({ length: 12 }, (_, i) => (
          <mesh key={i} rotation={[0, 0, (i / 12) * Math.PI * 2]} position={[0, 0, -0.02]}>
            <planeGeometry args={[0.07, 2.3]} />
            <meshBasicMaterial color="#ffd45e" transparent opacity={0.35} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </Billboard>
  );
}

// ---- Awan: gugus icosahedron flat-shaded yang melayang ke kanan dan muncul lagi dari kiri ----
const PUFFS: [number, number, number, number][] = [
  [0, 0, 0, 0.75],
  [0.7, -0.08, 0.1, 0.55],
  [-0.7, -0.1, -0.05, 0.55],
  [0.25, 0.35, 0, 0.5],
  [-0.3, 0.25, 0.15, 0.45],
];

function Clouds({ count, color, span, animate }: { count: number; color: string; span: number; animate: boolean }) {
  const clouds = useMemo(() => {
    const r = seeded(count * 97 + 13);
    return Array.from({ length: count }, (_, i) => ({
      x: -span / 2 + (span / count) * (i + r()),
      y: 4.6 + r() * 1.4,
      z: -3.6 + r() * 4.2,
      scale: 0.8 + r() * 0.6,
      speed: 0.25 + r() * 0.25,
    }));
  }, [count, span]);
  const refs = useRef<Array<THREE.Group | null>>([]);
  useFrame((_, delta) => {
    if (!animate) return;
    clouds.forEach((c, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.position.x += c.speed * delta;
      if (g.position.x > span / 2 + 2) g.position.x = -span / 2 - 2;
    });
  });
  return (
    <group>
      {clouds.map((c, i) => (
        <group
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          position={[c.x, c.y, c.z]}
          scale={c.scale}
        >
          {PUFFS.map(([x, y, z, r], k) => (
            <mesh key={k} position={[x, y, z]} castShadow>
              <icosahedronGeometry args={[r, 1]} />
              <meshStandardMaterial color={color} flatShading roughness={1} transparent opacity={0.95} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ---- Hujan: InstancedMesh garis tipis yang jatuh miring dan diulang dari atas ----
const RAIN_TOP = 7;
const SLANT = 0.18; // pergeseran x per satuan jatuh (angin)

interface Drop {
  x: number;
  y0: number; // ketinggian awal
  z: number;
  v: number; // pengali kecepatan per tetes
}

function Rain({ count, speed, area, animate }: { count: number; speed: number; area: { w: number; d: number }; animate: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const drops = useMemo<Drop[]>(() => {
    const r = seeded(count + 7);
    return Array.from({ length: count }, () => ({ x: (r() - 0.5) * area.w, y0: r() * RAIN_TOP, z: (r() - 0.5) * area.d, v: 0.8 + r() * 0.4 }));
  }, [count, area.w, area.d]);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), q: new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, -Math.atan(SLANT))), s: new THREE.Vector3(1, 1, 1), p: new THREE.Vector3() }), []);

  // Ketinggian tiap tetes dihitung langsung dari waktu (jatuh lalu muncul lagi dari atas), jadi
  // tidak ada state yang diubah per frame. t = 0 untuk tampilan diam.
  const write = (t: number) => {
    const mesh = ref.current;
    if (!mesh) return;
    const { m, q, s, p } = tmp;
    drops.forEach((d, i) => {
      const y = (((d.y0 - speed * d.v * t) % RAIN_TOP) + RAIN_TOP) % RAIN_TOP;
      m.compose(p.set(d.x + (RAIN_TOP - y) * SLANT, y, d.z), q, s);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };

  useLayoutEffect(() => write(0));

  useFrame((state) => {
    if (animate) write(state.clock.elapsedTime);
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false}>
      <boxGeometry args={[0.014, 0.36, 0.014]} />
      <meshBasicMaterial color="#a9c2dc" transparent opacity={0.55} toneMapped={false} />
    </instancedMesh>
  );
}

// ---- Petir: kilat bercabang sesekali (tiap 4–9 detik) dengan dua kedipan cepat ----
function Lightning({ area, animate, flashRef }: { area: { w: number; d: number }; animate: boolean; flashRef?: React.RefObject<number> }) {
  const [bolt, setBolt] = useState<[number, number, number][] | null>(null);
  const state = useRef({ next: 2.5, t: -1, seed: 1 });
  useFrame((_, delta) => {
    if (!animate) return;
    const s = state.current;
    if (s.t < 0) {
      s.next -= delta;
      if (s.next > 0) return;
      // Frame pemicu: kilat langsung tampil (t = 0) supaya tetap terlihat walau frame rate rendah.
      s.t = 0;
      s.seed += 1;
      const r = seeded(s.seed);
      setBolt(lightningBolt(s.seed, (r() - 0.5) * area.w * 0.8, -3 + r() * 2));
    } else {
      s.t += Math.min(delta, 0.1); // jeda frame panjang tidak melompati seluruh kedipan
    }
    if (flashRef) flashRef.current = flashLevel(s.t);
    if (s.t >= FLASH_DURATION) {
      s.t = -1;
      s.next = nextFlashDelay(Math.random());
      if (flashRef) flashRef.current = 0;
      setBolt(null);
    }
  });
  // Inti putih dengan pendar biru di belakangnya supaya kontras di langit terang maupun gelap.
  return bolt ? (
    <group>
      <Line points={bolt} color="#5b8def" lineWidth={8} transparent opacity={0.45} toneMapped={false} />
      <Line points={bolt} color="#ffffff" lineWidth={2.5} toneMapped={false} />
    </group>
  ) : null;
}

// Efek cuaca di diorama sesuai kondisi cuaca plant saat ini. Tanpa animasi (reduced motion),
// awan dan hujan tetap tampil diam dan petir tidak muncul.
export function WeatherEffects({ condition, stage, animate, flashRef }: Props) {
  const fx = WEATHER_FX[condition];
  return (
    <group>
      {fx.sun && <Sun animate={animate} />}
      {fx.clouds > 0 && <Clouds count={fx.clouds} color={fx.cloudColor} span={stage.w + 4} animate={animate} />}
      {fx.rain > 0 && <Rain count={fx.rain} speed={fx.rainSpeed} area={stage} animate={animate} />}
      {fx.lightning && animate && <Lightning area={stage} animate={animate} flashRef={flashRef} />}
    </group>
  );
}
