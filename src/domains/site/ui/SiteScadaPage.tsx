import { Monitor } from "lucide-react";
import { useScadaEmbed } from "@/domains/scada/application/use-scada-embed";
import { ScadaEmbedFrame } from "@/domains/scada/ui/ScadaEmbedFrame";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import scadaIllustration from "@/assets/figma/illustrations/illustration-scada-disconnected.png";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useSiteContext } from "../application/use-site";

// Halaman SCADA = viewer pihak ketiga yang disematkan; tanpa konfigurasi tampil empty state.
export function SiteScadaPage() {
  const { plant } = useSiteContext();
  const { data: embed, isPending, error, refetch } = useScadaEmbed(plant?.id ?? "");
  if (!plant) return null;

  return (
    <Panel icon={<Monitor />} title="SCADA" className="flex h-[600px] flex-col" bodyClassName="flex min-h-0 flex-1 flex-col">
      {isPending && (
        <div className="flex-1" aria-busy>
          <Skeleton className="h-full min-h-80 w-full" />
          <span className="sr-only">Memuat konfigurasi SCADA…</span>
        </div>
      )}

      {error && (
        <Alert
          tone="danger"
          title="Konfigurasi SCADA tidak bisa dimuat"
          action={
            <Button size="sm" variant="tertiary" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        >
          {error.message}
        </Alert>
      )}

      {!isPending && !error && embed === null && (
        <div className="flex flex-1 flex-col items-center pt-[84px] text-center">
          <img src={scadaIllustration} alt="" className="h-[200px] w-[280px]" />
          <div className="mt-10 max-w-full px-4">
            <h3 className="text-sm font-medium leading-6 text-text">SCADA isn’t connected yet</h3>
            <p className="mt-2 text-xs leading-5 text-muted md:whitespace-nowrap">This plant doesn’t have a SCADA viewer linked yet. Once it’s set up, live data from the site will show up here.</p>
          </div>
        </div>
      )}

      {embed && <ScadaEmbedFrame embed={embed} plantId={plant.id} plantName={plant.name} className="flex-1" />}
    </Panel>
  );
}
