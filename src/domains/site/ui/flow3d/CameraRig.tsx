import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import type { Vec3 } from "@/domains/site/domain/flow-geometry";

interface Props {
  position: Vec3;
  target: Vec3;
  insetRight?: number; // px kanvas di sisi kanan yang ditutup overlay (kotak angka)
}

interface TargetControls {
  target: Vector3;
  update(): void;
}

// Kamera menjauh dari target saat area yang terlihat sempit (rasio < 1,5) supaya seluruh
// tata letak (baterai di kiri sampai genset di kanan) masuk bingkai; bila sisi kanan kanvas
// ditutup overlay, pandangan digeser agar adegan berada di tengah area yang tersisa.
export function CameraRig({ position, target, insetRight = 0 }: Props) {
  const { camera, size, invalidate, controls } = useThree();
  useEffect(() => {
    const usable = Math.max(1, size.width - insetRight - (insetRight > 0 ? 48 : 0)); // sisakan tepi kiri untuk label
    const aspect = usable / Math.max(1, size.height);
    const scale = Math.min(2.4, Math.max(1, 1.5 / aspect));
    const t = new Vector3(target[0], target[1], target[2]);
    const p = new Vector3(target[0] + (position[0] - target[0]) * scale, target[1] + (position[1] - target[1]) * scale, target[2] + (position[2] - target[2]) * scale);
    camera.position.copy(p);
    camera.lookAt(t);
    camera.updateMatrix();
    if (insetRight > 0 && camera instanceof PerspectiveCamera) {
      // Geser kamera + target searah sumbu kanan kamera sebesar separuh lebar overlay di kedalaman target.
      const halfWidth = Math.tan((camera.fov * Math.PI) / 360) * p.distanceTo(t) * (size.width / Math.max(1, size.height));
      const right = new Vector3().setFromMatrixColumn(camera.matrix, 0).multiplyScalar((insetRight / size.width) * halfWidth);
      t.add(right);
      camera.position.add(right);
      camera.lookAt(t);
    }
    camera.updateProjectionMatrix();
    const c = controls as unknown as TargetControls | null;
    if (c && c.target) {
      c.target.copy(t);
      c.update();
    }
    invalidate();
  }, [camera, controls, size.width, size.height, position, target, insetRight, invalidate]);
  return null;
}
