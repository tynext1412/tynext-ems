import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import type { Vec3 } from "@/domains/site/domain/flow-geometry";

interface Props {
  targets: Record<string, Vec3>;
  refs: RefObject<Record<string, HTMLDivElement | null>>;
}

// Memproyeksikan titik 3D ke koordinat kanvas dan memindahkan label DOM ke sana tiap frame;
// titik tengah-bawah label menempel di titik tersebut (ujung garis penunjuk).
// Dipakai sebagai ganti portal (drei Html) supaya label hidup di pohon React biasa.
export function LabelProjector({ targets, refs }: Props) {
  const { camera, size, invalidate } = useThree();
  // Proyeksi memakai matriks kamera termasuk view offset dari FitCamera.
  const vec = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => invalidate(), [invalidate, targets]);

  useFrame(() => {
    for (const [key, p] of Object.entries(targets)) {
      const el = refs.current[key];
      if (!el) continue;
      vec.set(p[0], p[1], p[2]).project(camera);
      const x = (vec.x * 0.5 + 0.5) * size.width;
      const y = (-vec.y * 0.5 + 0.5) * size.height;
      el.style.setProperty("transform", `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`);
      el.style.setProperty("visibility", vec.z > 1 ? "hidden" : "visible");
    }
  });
  return null;
}
