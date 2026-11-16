import { ExternalLink, Maximize2, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { PlantId } from "@/domains/plant/domain/plant";
import { cn } from "@/shared/lib/cn";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { frameAspectRatio, isEmbeddableUrl, resolveScadaUrl, type ScadaEmbed } from "../domain/scada-embed";

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const ratio = frameAspectRatio(embed);

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Dengan rasio: bingkai sebanding dengan kanvas viewer, selebar panel tetapi muat di layar di bawah header
  // (±330 px; minimal 600 px tinggi di layar pendek). Di layar penuh: sebesar mungkin di tengah. Tanpa rasio:
  // bingkai mengisi panel.
  const frameStyle = ratio
    ? isFullscreen
      ? { aspectRatio: ratio, width: `min(100vw, calc(100vh * ${ratio}))` }
      : { aspectRatio: ratio, width: "100%", maxWidth: `max(${Math.round(600 * ratio)}px, calc((100dvh - 330px) * ${ratio}))` }
    : undefined;

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
      <Alert tone="danger" title="The SCADA viewer URL is not valid for embedding">
        <span className="font-mono">{url}</span>. Only http(s) is allowed.
      </Alert>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted">
        <span>
          Viewer: <span className="font-medium text-text">{embed.provider}</span>
        </span>
        <span className="ml-auto flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" onClick={reload}>
            <RotateCw className="size-4" aria-hidden />
            Reload
          </Button>
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text">
            <ExternalLink className="size-4" aria-hidden />
            Open in new tab
          </a>
          {embed.allowFullscreen && (
            <Button variant="ghost" size="sm" onClick={fullscreen}>
              <Maximize2 className="size-4" aria-hidden />
              Full screen
            </Button>
          )}
        </span>
      </div>

      <div ref={containerRef} className={cn(ratio ? "flex items-center justify-center" : "flex min-h-80 flex-1", ratio && isFullscreen && "bg-black")}>
        <div className={cn("relative overflow-hidden rounded-xl border border-separator bg-bg", !ratio && "flex-1")} style={frameStyle}>
          {status === "loading" && (
            <div className="absolute inset-0 z-10 p-3" aria-busy>
              <Skeleton className="h-full w-full rounded-lg" />
              <span className="sr-only">Loading SCADA viewer…</span>
            </div>
          )}
          {status === "timeout" && (
            <div role="alert" className="absolute inset-0 z-10 grid place-items-center bg-bg/90 p-6 text-center text-sm">
              <div className="max-w-md">
                <p className="font-medium text-text">The SCADA viewer didn't respond within {LOAD_TIMEOUT_MS / 1000} seconds.</p>
                <p className="mt-1 text-muted">Make sure the SCADA server allows embedding (X-Frame-Options / CSP headers) and is reachable from this network.</p>
                <Button variant="primary" onClick={reload} className="mt-4">
                  Try again
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
    </div>
  );
}
