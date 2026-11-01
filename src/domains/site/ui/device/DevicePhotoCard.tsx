import type { DeviceRecord } from "@/domains/device/domain/device";
import { DeviceIllustration } from "@/domains/device/ui/DeviceIllustration";
import { MasterChip } from "@/domains/device/ui/MasterChip";
import { CopyButton } from "@/shared/ui/CopyButton";
import { Panel } from "@/shared/ui/Panel";

// Kartu foto perangkat: foto produk bila tersedia, kalau tidak ilustrasi per tipe
// (dinyatakan jelas sebagai ilustrasi). SN bisa disalin.
export function DevicePhotoCard({ device }: { device: DeviceRecord }) {
  return (
    <Panel title="Device Photo" aria-label="Device photo" bodyClassName="flex flex-col items-center text-center">
      <div className="grid h-44 w-full place-items-center rounded-xl bg-bg p-3">
        {device.photoUrl ? <img src={device.photoUrl} alt={`Photo of ${device.name}`} className="max-h-full w-auto object-contain" /> : <DeviceIllustration kind={device.kind} className="h-full w-auto" />}
      </div>
      <p className="mt-3 flex items-center gap-1 text-xs text-muted">
        SN <span className="font-mono font-medium text-text">{device.serialNumber}</span>
        <CopyButton value={device.serialNumber} label="serial number" />
      </p>
      {device.kind === "INVERTER" && device.isMaster && <MasterChip className="mt-2" />}
      {!device.photoUrl && <p className="mt-2 text-[11px] text-muted">Illustration · product photo not available yet</p>}
    </Panel>
  );
}
