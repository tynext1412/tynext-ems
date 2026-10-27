import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import type { Plant } from "@/domains/plant/domain/plant";
import { PlantStatusBadge } from "@/domains/plant/ui/PlantStatusBadge";
import type { PowerSnapshot } from "@/domains/telemetry/domain/power-snapshot";
import { env } from "@/shared/config/env";
import { formatDateTime, formatRelative, timezoneAbbrev } from "@/shared/domain/time";
import { useNow } from "@/shared/lib/useNow";
import { Brand } from "@/shared/ui/Brand";
import { Skeleton } from "@/shared/ui/Skeleton";
import { UserMenu } from "@/domains/auth/ui/UserMenu";
import { ThemeToggle } from "@/shared/ui/ThemeToggle";
import { SiteSwitcher } from "./SiteSwitcher";

const STALE_AFTER_MS = 2 * 60_000;

interface Props {
  plant: Plant | null | undefined;
  snapshot: PowerSnapshot | null | undefined;
}

export function SiteHeader({ plant, snapshot }: Props) {
  const now = useNow();
  const stale = snapshot ? now - new Date(snapshot.at).getTime() > STALE_AFTER_MS : false;

  return (
    <header className="relative flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3 md:px-6">
      <div className="flex min-w-0 items-start gap-3">
        <div className="md:hidden">
          <Link to="/" className="flex h-9 items-center gap-1 text-sm text-muted" aria-label="Kembali ke dashboard">
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="min-w-0">
          {plant ? (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <PlantStatusBadge status={plant.status} />
                <SiteSwitcher current={plant} />
              </div>
              <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted">
                <span>
                  ID: <span className="font-mono">{plant.id}</span>
                </span>
                {snapshot && (
                  <span>
                    <span className="font-mono">{formatDateTime(snapshot.at, plant.location.timezone)}</span> {timezoneAbbrev(plant.location.timezone)}
                    {" · "}
                    <span className={stale ? "text-warn" : undefined}>
                      {stale ? `data lama, ${formatRelative(snapshot.at, now)}` : formatRelative(snapshot.at, now)}
                    </span>
                  </span>
                )}
              </p>
            </>
          ) : (
            <>
              <Skeleton className="h-6 w-64" />
              <Skeleton className="mt-2 h-3 w-40" />
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="md:hidden">
          <Brand />
        </span>
        {env.dataSource === "mock" && (
          <span className="flex h-9 items-center rounded-md border border-warn/50 px-3 text-xs text-warn" title="Angka berasal dari fixture mock, bukan API">
            Data dummy
          </span>
        )}
        <ThemeToggle />
        <UserMenu className="hidden md:flex" />
      </div>
    </header>
  );
}
