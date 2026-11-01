import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { scatterTrees, type TreeArea } from "@/domains/site/domain/flow-scenes";
import { PalmTree } from "@/shared/ui/three/primitives";

// Hijau kusam (bukan neon) supaya pohon jadi bingkai, bukan pusat perhatian.
const FOLIAGE = ["#6b8f5e", "#7fa06a", "#5e7d55"].map((c) => new THREE.Color(c));
const TRUNK = "#7a6146";

// Pohon berdaun lebar sebagai InstancedMesh: satu draw call untuk semua mahkota dan satu untuk
// semua batang; tiap instance punya skala, rotasi, dan nada hijau sendiri.
function Broadleaf({ areas, seed }: { areas: TreeArea[]; seed: number }) {
  const trees = useMemo(() => areas.flatMap((a, i) => scatterTrees(a, seed * 100 + i)), [areas, seed]);
  const foliage = useRef<THREE.InstancedMesh>(null);
  const trunks = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const f = foliage.current;
    const t = trunks.current;
    if (!f || !t) return;
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    trees.forEach((tree, i) => {
      const s = tree.scale;
      q.setFromEuler(e.set(0, tree.rotation, 0));
      m.compose(new THREE.Vector3(tree.x, 0.95 * s, tree.z), q, new THREE.Vector3(s, s * 1.15, s));
      f.setMatrixAt(i, m);
      f.setColorAt(i, FOLIAGE[tree.tone]);
      m.compose(new THREE.Vector3(tree.x, 0.28 * s, tree.z), q, new THREE.Vector3(s, s, s));
      t.setMatrixAt(i, m);
    });
    f.instanceMatrix.needsUpdate = true;
    if (f.instanceColor) f.instanceColor.needsUpdate = true;
    t.instanceMatrix.needsUpdate = true;
  }, [trees]);

  return (
    <group>
      <instancedMesh ref={foliage} args={[undefined, undefined, trees.length]} castShadow receiveShadow>
        <icosahedronGeometry args={[0.55, 0]} />
        <meshStandardMaterial flatShading roughness={0.9} />
      </instancedMesh>
      <instancedMesh ref={trunks} args={[undefined, undefined, trees.length]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 0.56, 6]} />
        <meshStandardMaterial color={TRUNK} roughness={0.9} />
      </instancedMesh>
    </group>
  );
}

function Palms({ areas, seed }: { areas: TreeArea[]; seed: number }) {
  const trees = useMemo(() => areas.flatMap((a, i) => scatterTrees(a, seed * 100 + i)), [areas, seed]);
  return (
    <group>
      {trees.map((t, i) => (
        <PalmTree key={i} position={[t.x, 0, t.z]} height={1.5 + t.scale * 0.6} rotation={t.rotation} />
      ))}
    </group>
  );
}

export function Trees({ areas, seed }: { areas: TreeArea[]; seed: number }) {
  const broadleaf = areas.filter((a) => a.kind === "broadleaf");
  const palm = areas.filter((a) => a.kind === "palm");
  return (
    <>
      {broadleaf.length > 0 && <Broadleaf areas={broadleaf} seed={seed} />}
      {palm.length > 0 && <Palms areas={palm} seed={seed} />}
    </>
  );
}
