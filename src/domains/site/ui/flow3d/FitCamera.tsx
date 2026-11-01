import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { centerOf, fitDistance } from "@/domains/site/domain/flow-scenes";
import type { Vec3 } from "@/domains/site/domain/flow-geometry";

interface Props {
  points: Vec3[]; // titik yang wajib terlihat (sudut panggung + titik label)
  direction: Vec3; // arah dari pusat adegan ke kamera
  // Ruang layar (px) yang tidak boleh ditempati adegan: label DOM di atas titik teratas,
  // chip petunjuk dan sakelar 3D/2D di bawah, sedikit di kiri-kanan untuk label tepi.
  margin?: { top: number; bottom: number; side: number };
  // Hasil framing: pusat (untuk target orbit) dan jarak (untuk batas zoom).
  onFit: (fit: { center: Vec3; distance: number }) => void;
}

const DEFAULT_MARGIN = { top: 50, bottom: 44, side: 28 };

// Kamera otomatis pas dengan isi adegan, dihitung ulang tiap ukuran kanvas berubah. Adegan
// digeser lewat view offset supaya berada di tengah area layar yang tersisa setelah margin.
export function FitCamera({ points, direction, margin = DEFAULT_MARGIN, onFit }: Props) {
  const { camera, size, invalidate } = useThree();

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera) || size.width === 0 || size.height === 0) return;
    const usableH = Math.max(1, size.height - margin.top - margin.bottom) / size.height;
    const usableW = Math.max(1, size.width - margin.side * 2) / size.width;
    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    const tanH = tanV * (size.width / size.height);
    const center = centerOf(points);
    const dist = fitDistance(points, center, direction, tanH * usableW, tanV * usableH) * 1.02;

    const dir = new Vector3(...direction).normalize();
    const c = new Vector3(...center);
    camera.position.copy(c).addScaledVector(dir, dist);
    camera.lookAt(c);
    camera.setViewOffset(size.width, size.height, 0, (margin.bottom - margin.top) / 2, size.width, size.height);
    camera.updateProjectionMatrix();

    onFit({ center, distance: dist });
    invalidate();
  }, [camera, size.width, size.height, points, direction, margin.top, margin.bottom, margin.side, onFit, invalidate]);

  return null;
}
