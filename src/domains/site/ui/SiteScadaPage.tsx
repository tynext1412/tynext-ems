import { useScadaEmbed } from "@/domains/scada/application/use-scada-embed";
import { ScadaEmbedFrame } from "@/domains/scada/ui/ScadaEmbedFrame";
import { Button } from "@/shared/ui/Button";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useSiteContext } from "../application/use-site";

// Halaman SCADA = viewer pihak ketiga yang disematkan; tidak ada diagram buatan sendiri.
export function SiteScadaPage() {
  const { plant } = useSiteContext();
  const { data: embed, isPending, error, refetch } = useScadaEmbed(plant?.id ?? "");
  if (!plant) return null;

  return (
    <Panel title="SCADA" className="flex min-h-[calc(100dvh-200px)] flex-col">
      {isPending && (
        <div className="flex-1" aria-busy>
          <Skeleton className="h-full min-h-80 w-full" />
          <span className="sr-only">Memuat konfigurasi SCADA…</span>
        </div>
      )}

      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm">
          <span>Konfigurasi SCADA tidak bisa dimuat: {error.message}.</span>
          <Button onClick={() => void refetch()} className="h-9">
            Coba muat ulang
          </Button>
        </div>
      )}

      {!isPending && !error && embed === null && (
        <div className="grid flex-1 place-items-center py-16 text-center text-sm">
          <div className="max-w-md">
            <p className="font-medium">Viewer SCADA belum dikonfigurasi untuk {plant.name}.</p>
            <p className="mt-2 text-muted">
              Halaman ini hanya menyematkan viewer SCADA pihak ketiga. Isi URL viewer untuk plant ini di backend, atau set{" "}
              <span className="font-mono">VITE_SCADA_URL_TEMPLATE</span> (mendukung placeholder <span className="font-mono">{"{plantId}"}</span>).
            </p>
          </div>
        </div>
      )}

      {embed && <ScadaEmbedFrame embed={embed} plantId={plant.id} plantName={plant.name} className="flex-1" />}
    </Panel>
  );
}
