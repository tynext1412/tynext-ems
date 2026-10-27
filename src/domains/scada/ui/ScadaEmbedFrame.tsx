import { ExternalLink, Maximize2, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PlantId } from "@/domains/plant/domain/plant";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { isEmbeddableUrl, resolveScadaUrl, type ScadaEmbed } from "../domain/scada-embed";

const LOAD_TIMEOUT_MS = 20_000;

interface Props {
  embed: ScadaEmbed;
  plantId: PlantId;
  plantName: string;
  className?: string;
}

// Iframe ke viewer SCADA pihak ketiga. Kita tidak menggambar apa pun di dalamnya;
// yang kita sediakan hanya bingkai, status muat, dan kontrol (muat ulang, tab baru, layar penuh).
export function ScadaEmbedFrame({ embed, plantId, plantName, className }: Props) {
  const url = resolveScadaUrl(embed, plantId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<"loading" | "ready" | "timeout">("loading");

  useEffect(() => {
    if (status !== "loading") return;
    const id = setTimeout(() => setStatus("timeout"), LOAD_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, [status, attempt]);

  const reload = () => {
    setStatus("loading");
    setAttempt((n) => n + 1);
  };

  const fullscreen = () => {
    void containerRef.current?.requestFullscreen?.();
  };

  if (!isEmbeddableUrl(url)) {
    return (
      <p role="alert" className="text-sm text-danger">
        URL viewer SCADA tidak valid untuk disematkan: <span className="font-mono">{url}</span>. Hanya http(s) yang diizinkan.
      </p>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>
          Viewer: <span className="text-text">{embed.provider}</span>
        </span>
        <span className="ml-auto flex items-center gap-1">
          <Button variant="ghost" className="h-9" onClick={reload}>
            <RotateCw className="size-4" aria-hidden />
            Muat ulang
          </Button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <ExternalLink className="size-4" aria-hidden />
            Buka di tab baru
          </a>
          {embed.allowFullscreen && (
            <Button variant="ghost" className="h-9" onClick={fullscreen}>
              <Maximize2 className="size-4" aria-hidden />
              Layar penuh
            </Button>
          )}
        </span>
      </div>

      <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden rounded-md border border-border bg-bg">
        {status === "loading" && (
          <div className="absolute inset-0 z-10 p-4" aria-busy>
            <Skeleton className="h-full w-full" />
            <span className="sr-only">Memuat viewer SCADA…</span>
          </div>
        )}
        {status === "timeout" && (
          <div role="alert" className="absolute inset-0 z-10 grid place-items-center bg-bg/90 p-6 text-center text-sm">
            <div>
              <p>Viewer SCADA tidak merespons dalam {LOAD_TIMEOUT_MS / 1000} detik.</p>
              <p className="mt-1 text-muted">Pastikan server SCADA mengizinkan embed (header X-Frame-Options / CSP) dan dapat dijangkau dari jaringan ini.</p>
              <Button onClick={reload} className="mt-4">
                Coba muat ulang
              </Button>
            </div>
          </div>
        )}
        <iframe
          key={attempt}
          src={url}
          title={`SCADA ${plantName}`}
          className="h-full w-full"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          referrerPolicy="no-referrer"
          allow={embed.allowFullscreen ? "fullscreen" : undefined}
          onLoad={() => setStatus("ready")}
        />
      </div>
    </div>
  );
}
