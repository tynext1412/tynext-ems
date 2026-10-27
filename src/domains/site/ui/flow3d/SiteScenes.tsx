import type { FlowLayout } from "@/domains/site/domain/flow-layouts";
import type { ScenePalette } from "@/shared/ui/three/scene-palette";
import {
  BatteryBank,
  Building,
  Cone,
  Conveyor,
  CropRows,
  Excavator,
  Genset,
  GridTower,
  HaulTruck,
  Mill,
  Pad,
  PalmTree,
  Pool,
  PvArray,
  Silo,
  Switchgear,
  Terraces,
  WaterTank,
} from "@/shared/ui/three/primitives";

export interface SceneProps {
  layout: FlowLayout;
  hasBattery: boolean;
  batteryUnits: number;
  palette: ScenePalette;
}

// Objek EMS (PV, baterai, genset, grid, switchgear) ada di semua adegan pada posisi anchor
// layout; yang berbeda adalah beban (site) dan lingkungannya.
function Common({ layout, hasBattery, batteryUnits, pv }: SceneProps & { pv: { rows: number; cols: number; elevated?: boolean } }) {
  const A = layout.anchors;
  return (
    <>
      <PvArray position={[A.pv[0], 0, A.pv[2]]} rows={pv.rows} cols={pv.cols} elevated={pv.elevated} />
      {hasBattery && <BatteryBank position={[A.battery[0], 0, A.battery[2]]} units={batteryUnits} />}
      <Genset position={[A.genset[0], 0, A.genset[2]]} />
      <GridTower position={[A.grid[0], 0, A.grid[2]]} />
      <Switchgear position={[layout.bus[0], 0, layout.bus[2]]} />
    </>
  );
}

export function ResortScene(props: SceneProps) {
  const L = props.layout.anchors.load;
  const palms: Array<[number, number, number]> = [
    [-3.4, -6.6, 2.1],
    [3.8, -6.4, 1.9],
    [-2.0, -3.3, 1.6],
    [2.3, -3.1, 1.7],
    [-7.2, -5.2, 2.2],
    [7.2, -5.6, 2.0],
    [6.8, -0.2, 1.8],
    [-7.3, -0.4, 1.9],
  ];
  return (
    <>
      <Pad position={[L[0], 0.02, L[2] + 0.4]} size={[9, 5]} color={props.palette.lawn} />
      <Building position={[L[0], 0, L[2]]} size={[3.4, 1.9, 1.5]} color="#e8e2d6" roofColor="#7a4f33" windows={6} />
      <Building position={[L[0] + 2.7, 0, L[2] + 0.6]} size={[1.6, 1.2, 1.3]} color="#e3dccf" roofColor="#7a4f33" windows={3} />
      <Pool position={[L[0] - 3.0, 0, L[2] + 1.0]} size={[1.9, 1.2]} />
      {palms.map(([x, z, h]) => (
        <PalmTree key={`${x}${z}`} position={[x, 0, z]} height={h} />
      ))}
      <Common {...props} pv={{ rows: 2, cols: 4, elevated: true }} />
    </>
  );
}

export function MiningScene(props: SceneProps) {
  const L = props.layout.anchors.load;
  return (
    <>
      <Pad position={[0, 0.02, -5]} size={[17, 7]} color={props.palette.dirt} />
      <Building position={[L[0], 0, L[2]]} size={[3, 2.2, 1.6]} color="#8e9297" roofColor="#4a4e52" windows={0} />
      <Silo position={[L[0] + 2.2, 0, L[2] - 0.2]} />
      <Silo position={[L[0] + 3.2, 0, L[2] - 0.2]} radius={0.4} height={1.9} />
      <Terraces position={[-3.6, 0, -7.4]} />
      <Conveyor position={[-1.4, 0, -6.2]} rotation={[0, -0.2, 0]} />
      <Cone position={[3.6, 0.5, -7.6]} radius={1.3} height={1.0} color="#4f4136" />
      <Cone position={[5.2, 0.35, -6.4]} radius={0.9} height={0.7} color="#5b4b3d" />
      <HaulTruck position={[2.8, 0, -3.2]} rotation={[0, 0.5, 0]} />
      <Excavator position={[-2.6, 0, -4.4]} rotation={[0, -0.6, 0]} />
      <Common {...props} pv={{ rows: 3, cols: 5 }} />
    </>
  );
}

export function PlantationScene(props: SceneProps) {
  const L = props.layout.anchors.load;
  return (
    <>
      <Mill position={[L[0], 0, L[2]]} />
      <WaterTank position={[2.6, 0, -4.0]} />
      <CropRows position={[-4.6, 0, -7.4]} rows={4} cols={6} soil={props.palette.soil} />
      <CropRows position={[4.6, 0, -7.4]} rows={4} cols={6} soil={props.palette.soil} />
      <CropRows position={[-8.4, 0, -1.2]} rows={7} cols={2} soil={props.palette.soil} />
      <CropRows position={[8.4, 0, -1.2]} rows={7} cols={2} soil={props.palette.soil} />
      <Common {...props} pv={{ rows: 2, cols: 5 }} />
    </>
  );
}
