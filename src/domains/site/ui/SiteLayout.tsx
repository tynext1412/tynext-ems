import { Outlet, useParams } from "react-router-dom";
import { Button } from "@/shared/ui/Button";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useSite } from "../application/use-site";
import { SiteHeader } from "./SiteHeader";
import { SiteSidebar } from "./SiteSidebar";

// Kerangka halaman site: sidebar menu + header plant + konten per menu (Outlet).
export function SiteLayout() {
  const { plantId = "" } = useParams();
  const site = useSite(plantId);

  return (
    <div className="flex h-dvh overflow-hidden">
      <SiteSidebar variant="side" activeAlarms={site.activeAlarmCount} />

      <div className="flex min-w-0 flex-1 flex-col">
        <SiteHeader plant={site.plant} snapshot={site.snapshot} />
        <SiteSidebar variant="strip" activeAlarms={site.activeAlarmCount} />

        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6">
          {site.isPending && (
            <Panel>
              <Skeleton className="mb-3 h-6 w-64" />
              <Skeleton className="h-4 w-40" />
              <span className="sr-only">Memuat data plant…</span>
            </Panel>
          )}

          {site.error && (
            <Panel>
              <p role="alert" className="mb-3 text-sm">
                Data plant tidak bisa dimuat: {site.error.message}.
              </p>
              <Button onClick={site.retry}>Coba muat ulang</Button>
            </Panel>
          )}

          {!site.isPending && !site.error && site.plant === null && (
            <Panel>
              <p className="text-sm">
                Plant <span className="font-mono">{plantId}</span> tidak ada di daftar. Kembali ke dashboard untuk memilih plant lain.
              </p>
            </Panel>
          )}

          {site.plant && <Outlet context={site} />}
        </main>
      </div>
    </div>
  );
}
