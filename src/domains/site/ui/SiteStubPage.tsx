import { Link } from "react-router-dom";
import { Panel } from "@/shared/ui/Panel";

// Menu yang sudah ada di navigasi tetapi belum punya spesifikasi/desain.
// Ditandai jelas supaya tidak terlihat seperti halaman jadi.
export function SiteStubPage({ title }: { title: string }) {
  return (
    <Panel title={title}>
      <p className="text-sm text-muted">
        Halaman {title} belum dirancang. Isi menu ini menyusul setelah spesifikasi dan desainnya tersedia.
      </p>
      <Link to="." relative="route" className="mt-4 inline-flex h-10 items-center text-sm text-copper underline-offset-2 hover:underline">
        Kembali ke Overview
      </Link>
    </Panel>
  );
}
