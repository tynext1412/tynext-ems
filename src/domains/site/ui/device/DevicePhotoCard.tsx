import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { DeviceRecord } from "@/domains/device/domain/device";
import { DeviceIllustration } from "@/domains/device/ui/DeviceIllustration";
import { MasterChip } from "@/domains/device/ui/MasterChip";

// Kartu foto perangkat: foto produk bila tersedia, kalau tidak ilustrasi per tipe
// (dinyatakan jelas sebagai ilustrasi). SN bisa disalin.
export function DevicePhotoCard({ device }: { device: DeviceRecord }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(device.serialNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard tidak tersedia; nilai tetap terlihat untuk disalin manual */
    }
  };

  return (
    <section className="panel-metal flex flex-col items-center rounded-lg p-5 text-center" aria-label="Foto perangkat">
      <div className="grid h-44 w-full place-items-center rounded-md bg-bg p-3">
        {device.photoUrl ? <img src={device.photoUrl} alt={`Foto ${device.name}`} className="max-h-full w-auto object-contain" /> : <DeviceIllustration kind={device.kind} className="h-full w-auto" />}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        SN <span className="font-mono text-text">{device.serialNumber}</span>
        <button type="button" onClick={() => void copy()} aria-label={copied ? "Serial number tersalin" : "Salin serial number"} className="inline-flex size-7 items-center justify-center rounded-sm text-muted hover:bg-surface-2 hover:text-text">
          {copied ? <Check className="size-3.5 text-ok" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        </button>
      </p>
      {device.kind === "INVERTER" && device.isMaster && <MasterChip className="mt-2" />}
      {!device.photoUrl && <p className="mt-2 text-[11px] text-muted">Ilustrasi · foto produk belum tersedia</p>}
    </section>
  );
}
