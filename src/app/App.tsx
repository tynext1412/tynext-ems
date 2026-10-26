import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DashboardPage } from "@/domains/dashboard/ui/DashboardPage";
import { SiteAlarmPage } from "@/domains/site/ui/SiteAlarmPage";
import { SiteDevicePage } from "@/domains/site/ui/SiteDevicePage";
import { SiteInfoPage } from "@/domains/site/ui/SiteInfoPage";
import { SiteLayout } from "@/domains/site/ui/SiteLayout";
import { SiteOverviewPage } from "@/domains/site/ui/SiteOverviewPage";
import { SiteStubPage } from "@/domains/site/ui/SiteStubPage";
import { createRepositories } from "./container";
import { AppProviders } from "./providers";

const repositories = createRepositories();

export function App() {
  return (
    <AppProviders repositories={repositories}>
      <BrowserRouter>
        <Routes>
          <Route index element={<DashboardPage />} />
          <Route path="plants/:plantId" element={<SiteLayout />}>
            <Route index element={<SiteOverviewPage />} />
            <Route path="scada" element={<SiteStubPage title="SCADA" />} />
            <Route path="info" element={<SiteInfoPage />} />
            <Route path="device" element={<SiteDevicePage />} />
            <Route path="alarm" element={<SiteAlarmPage />} />
            <Route path="om-schedule" element={<SiteStubPage title="O&M schedule" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}
