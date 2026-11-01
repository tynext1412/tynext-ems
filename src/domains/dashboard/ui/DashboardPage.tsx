import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { EnvironmentalBenefitsPanel } from "@/domains/impact/ui/EnvironmentalBenefitsPanel";
import type { StatusCount } from "@/domains/plant/domain/status-policy";
import { PlantMap } from "@/domains/plant/ui/PlantMap";
import { cn } from "@/shared/lib/cn";
import { AppHeader } from "@/shared/ui/AppHeader";
import { BottomSheet } from "@/shared/ui/BottomSheet";
import { CountBadge } from "@/shared/ui/Chip";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useDashboardOverview } from "../application/use-dashboard-overview";
import { BessPerformanceCard } from "./BessPerformanceCard";
import { KpiRow } from "./KpiCards";
import { PlantListPanel } from "./PlantListPanel";

// Baris KPI menempel di top 68 px dengan tinggi 80 px; kartu hover peta tidak boleh masuk ke area ini.
const KPI_ROW_BOTTOM = 68 + 80 + 8;

// Sheet terbuka disimpan di hash URL supaya bisa dibagikan dan tombol Back menutupnya.
const SHEET_HASH = "#site-list";
// Sheet berhenti di bawah kartu KPI (header 56 + jarak 12 + kartu 80 + 28).
const SHEET_TOP_OFFSET = 171;

export function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { plants, plantSummary, performanceSummary, impact, plantsState, performancesState } = useDashboardOverview();

  const sheetOpen = location.hash === SHEET_HASH;
  const setSheetOpen = useCallback(
    (open: boolean) => {
      navigate({ pathname: location.pathname, hash: open ? SHEET_HASH : "" }, { replace: !open });
    },
    [navigate, location.pathname],
  );

  return (
    <div className="relative isolate h-dvh overflow-hidden bg-bg">
      <div className="absolute inset-0 z-0">
        <PlantMap plants={plants} loading={plantsState.isPending} onSelect={(id) => navigate(`/plants/${id}`)} popupTopInset={KPI_ROW_BOTTOM} />
      </div>
      <div className="map-vignette pointer-events-none absolute inset-0 z-[1]" aria-hidden />

      {/* Header di atas kartu KPI (menu profil) tapi di bawah backdrop sheet (z-20) supaya ikut redup saat Site List terbuka. */}
      <AppHeader className="z-[15]" />

      <KpiRow plantSummary={plantSummary} performanceSummary={performanceSummary} plantsState={plantsState} performancesState={performancesState} className="absolute inset-x-0 top-[68px] z-10" />

      <EnvironmentalBenefitsPanel impact={impact} loading={performancesState.isPending} error={performancesState.error} onRetry={performancesState.retry} inset={4} className="absolute bottom-24 left-6 z-10 hidden w-[232px] shadow-overlay md:block" />
      <BessPerformanceCard bess={performanceSummary?.bess} loading={performancesState.isPending} error={performancesState.error} onRetry={performancesState.retry} inset={4} className="absolute bottom-24 right-6 z-10 hidden w-[320px] shadow-overlay md:block" />

      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen} topOffset={SHEET_TOP_OFFSET} header={(open) => <SiteListHeader statusCount={plantSummary?.statusCount} loading={plantsState.isPending} open={open} />} aria-label="Site list">
        <div className="mb-5 grid gap-3 md:hidden">
          <EnvironmentalBenefitsPanel impact={impact} loading={performancesState.isPending} error={performancesState.error} onRetry={performancesState.retry} />
          <BessPerformanceCard bess={performanceSummary?.bess} loading={performancesState.isPending} error={performancesState.error} onRetry={performancesState.retry} />
        </div>
        <PlantListPanel statusCount={plantSummary?.statusCount} onCheckAgain={plantsState.retry} />
      </BottomSheet>
    </div>
  );
}

// Legend status hanya tampil saat sheet tertutup (di Figma, saat terbuka tab yang memuat jumlahnya).
function SiteListHeader({ statusCount, loading, open }: { statusCount?: StatusCount; loading: boolean; open: boolean }) {
  const total = statusCount ? statusCount.ONLINE + statusCount.ALARM + statusCount.OFFLINE : undefined;
  return (
    <>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-lg font-semibold leading-7">
          Site List
          {total !== undefined ? <CountBadge value={total} className="h-7 min-w-7 border border-bg text-xs" /> : loading ? <Skeleton className="h-7 w-7 rounded-full" /> : null}
        </h2>
        <p className="truncate text-sm text-muted">Monitor performance and status of each site</p>
      </div>
      {open ? null : loading || !statusCount ? (
        <Skeleton className="mt-3.5 hidden h-6 w-64 sm:block" />
      ) : (
        <div className="mt-3.5 hidden items-center gap-4 text-sm leading-6 sm:flex" aria-label="Status summary">
          <LegendItem color="bg-[#2b7a30]" textClass="text-[#2b7a30]" label="Online" value={statusCount.ONLINE} />
          <span className="h-6 w-px bg-border" aria-hidden />
          <LegendItem color="bg-[#f5a524]" textClass="text-[#f5a524]" label="Alarm" value={statusCount.ALARM} />
          <span className="h-6 w-px bg-border" aria-hidden />
          <LegendItem color="bg-[#c62828]" textClass="text-[#c62828]" label="Offline" value={statusCount.OFFLINE} />
        </div>
      )}
    </>
  );
}

function LegendItem({ color, textClass, label, value }: { color: string; textClass: string; label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("size-2 rounded-full", color)} aria-hidden />
      <span className={textClass}>{label}</span>
      <span className="font-mono font-medium text-text">({value})</span>
    </span>
  );
}
