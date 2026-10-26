import { ChevronUp } from "lucide-react";
import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { EnvironmentalBenefitsPanel } from "@/domains/impact/ui/EnvironmentalBenefitsPanel";
import { PlantMap } from "@/domains/plant/ui/PlantMap";
import { env } from "@/shared/config/env";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { Brand } from "@/shared/ui/Brand";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { UserMenu } from "@/shared/ui/UserMenu";
import { useDashboardOverview } from "../application/use-dashboard-overview";
import type { DashboardOverview } from "../domain/overview";
import { BessPerformanceCard } from "./BessPerformanceCard";
import { PlantListPanel } from "./PlantListPanel";
import { SummaryStrip } from "./SummaryStrip";

// Sheet terbuka disimpan di hash URL supaya bisa dibagikan dan tombol Back menutupnya.
const SHEET_HASH = "#plant-list";

export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plants, overview, impact, retry, isPending, error } = useDashboardOverview();

  const sheetOpen = location.hash === SHEET_HASH;
  const setSheetOpen = useCallback(
    (open: boolean) => {
      navigate({ pathname: location.pathname, hash: open ? SHEET_HASH : "" }, { replace: !open });
    },
    [navigate, location.pathname],
  );

  return (
    <div className="relative isolate h-dvh overflow-hidden">
      <div className="absolute inset-0 z-0">
        <PlantMap plants={plants} onSelect={(id) => navigate(`/plants/${id}`)} />
      </div>
      <div className="map-vignette pointer-events-none absolute inset-0 z-[1]" aria-hidden />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-3 p-4 md:flex-row md:items-start">
        <div className="pointer-events-auto flex items-center justify-between gap-3 md:w-44 md:pt-2">
          <Brand />
          <div className="flex gap-2 md:hidden">{dataSourceBadge()}</div>
        </div>

        <SummaryStrip summary={overview?.summary} loading={isPending} className="pointer-events-auto md:mx-auto md:w-full md:max-w-4xl" />

        <div className="pointer-events-auto hidden items-center gap-2 md:flex">
          {dataSourceBadge()}
          <UserMenu />
        </div>
      </header>

      <EnvironmentalBenefitsPanel impact={impact} loading={isPending} className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 md:block" />
      <BessPerformanceCard bess={overview?.bess} loading={isPending} className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 md:block" />

      {error && (
        <div
          role="alert"
          className="absolute inset-x-4 top-36 z-10 mx-auto flex w-fit max-w-full flex-wrap items-center gap-3 rounded-md border border-danger/50 bg-surface px-4 py-3 text-sm"
        >
          <span>Ringkasan tidak bisa dimuat: {error.message}.</span>
          <Button onClick={retry} className="h-9">
            Coba muat ulang
          </Button>
        </div>
      )}

      <BottomSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Plant List"
        peek={<PeekBar overview={overview} loading={isPending} />}
      >
        <div className="mb-5 grid gap-3 md:hidden">
          <EnvironmentalBenefitsPanel impact={impact} loading={isPending} className="w-full" />
          <BessPerformanceCard bess={overview?.bess} loading={isPending} className="w-full" />
        </div>
        <PlantListPanel statusCount={overview?.statusCount} />
      </BottomSheet>
    </div>
  );
}

function dataSourceBadge() {
  if (env.dataSource !== "mock") return null;
  return (
    <span className="flex h-9 items-center rounded-md border border-warn/50 px-3 text-xs text-warn" title="Angka berasal dari fixture mock, bukan API">
      Data dummy
    </span>
  );
}

function PeekBar({ overview, loading }: { overview?: DashboardOverview; loading: boolean }) {
  const count = overview?.statusCount;

  return (
    <span className="flex w-full items-center gap-4">
      <span className="flex flex-col">
        <span className="text-base font-semibold">Plant List</span>
        <span className="text-xs text-muted">Geser atau klik untuk membuka</span>
      </span>

      {loading || !count ? (
        <Skeleton className="h-5 w-40" />
      ) : (
        <span className="hidden items-center gap-3 font-mono text-sm sm:flex">
          <Count color="bg-ok" label="Online" value={count.ONLINE} />
          <Count color="bg-warn" label="Alarm" value={count.ALARM} />
          <Count color="bg-danger" label="Offline" value={count.OFFLINE} />
        </span>
      )}

      <ChevronUp className="ml-auto size-5 text-copper" aria-hidden />
    </span>
  );
}

function Count({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${color}`} aria-hidden />
      <span className="text-muted">{label}</span>
      <span>{value}</span>
    </span>
  );
}
