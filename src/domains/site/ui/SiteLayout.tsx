import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Outlet, useParams } from "react-router-dom";
import { AppHeader } from "@/shared/ui/AppHeader";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { OutageBanner } from "@/domains/outage/ui/OutageBanner";
import { Skeleton } from "@/shared/ui/Skeleton";
import { useSite, useSiteContext, type SiteContext } from "../application/use-site";
import { SiteHeader } from "./SiteHeader";
import { SiteSidebar } from "./SiteSidebar";

export interface SiteLayoutContext extends SiteContext {
  headerActionsEl: HTMLDivElement | null;
}

// Kerangka halaman site: header global, menu kiri, dan kartu putih berisi judul plant + konten menu.
export function SiteLayout() {
  const { plantId = "" } = useParams();
  const site = useSite(plantId);
  const [headerActionsEl, setHeaderActionsEl] = useState<HTMLDivElement | null>(null);
  const context: SiteLayoutContext = { ...site, headerActionsEl };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-bg">
      <AppHeader />
      <div className="flex min-h-0 flex-1">
        <SiteSidebar variant="side" activeAlarms={site.activeAlarmCount} />

        <main className="min-w-0 flex-1 overflow-y-auto p-3 pt-3 md:pl-0">
          <SiteSidebar variant="strip" activeAlarms={site.activeAlarmCount} />
          <div className="min-h-full rounded-3xl bg-surface p-4 md:p-6">
            <SiteHeader plant={site.plant} actionsRef={setHeaderActionsEl} />

            {site.isPending && (
              <div className="grid gap-4" aria-busy>
                <Skeleton className="h-64 w-full rounded-[20px]" />
                <Skeleton className="h-40 w-full rounded-[20px]" />
                <span className="sr-only">Loading plant data…</span>
              </div>
            )}

            {site.error && (
              <EmptyState
                illustration="server-error"
                title="Plant data couldn't load"
                description={site.error.message}
                action={
                  <Button variant="primary" onClick={site.retry}>
                    Try again
                  </Button>
                }
              />
            )}

            {!site.isPending && !site.error && site.plant === null && (
              <EmptyState illustration="not-found" title="Plant not found" description={`Plant ${plantId} isn't in your list. Go back to Home to choose another plant.`} />
            )}

            {site.plant && <OutageBanner plant={site.plant} />}
            {site.plant && <Outlet context={context} />}
          </div>
        </main>
      </div>
    </div>
  );
}

// Tombol aksi di baris judul halaman (mis. "Add Activity" di O&M), dirender lewat portal ke SiteHeader.
export function SiteHeaderActions({ children }: { children: ReactNode }) {
  const { headerActionsEl } = useSiteContext() as SiteLayoutContext;
  return headerActionsEl ? createPortal(children, headerActionsEl) : null;
}
