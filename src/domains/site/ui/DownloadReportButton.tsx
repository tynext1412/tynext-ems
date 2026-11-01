import { Download } from "lucide-react";
import { Button } from "@/shared/ui/Button";

// Tombol "Download report" di samping pemilih tanggal: mengunduh .xlsx dari data yang tampil.
export function DownloadReportButton({ onClick, pending, disabled, title }: { onClick: () => void; pending: boolean; disabled?: boolean; title?: string }) {
  return (
    <Button onClick={onClick} loading={pending} disabled={disabled || pending} title={title ?? "Download the data shown as an Excel file"}>
      {!pending && <Download className="size-4" aria-hidden />}
      {pending ? "Preparing…" : "Download report"}
    </Button>
  );
}
