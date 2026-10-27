import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/domains/auth/ui/LoginPage";
import { RequireAuth } from "@/domains/auth/ui/RequireAuth";
import { DashboardPage } from "@/domains/dashboard/ui/DashboardPage";
import { SiteAlarmPage } from "@/domains/site/ui/SiteAlarmPage";
import { SiteDevicePage } from "@/domains/site/ui/SiteDevicePage";
import { DeviceDetailPage } from "@/domains/site/ui/device/DeviceDetailPage";
import { SiteInfoPage } from "@/domains/site/ui/SiteInfoPage";
import { SiteLayout } from "@/domains/site/ui/SiteLayout";
import { SiteOverviewPage } from "@/domains/site/ui/SiteOverviewPage";
import { SiteScadaPage } from "@/domains/site/ui/SiteScadaPage";
import { SiteOmPage } from "@/domains/site/ui/om/SiteOmPage";
import { createRepositories } from "./container";
import { AppProviders } from "./providers";

const repositories = createRepositories();

export function App() {
  return (
    <AppProviders repositories={repositories}>
      <BrowserRouter>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
          <Route index element={<DashboardPage />} />
          <Route path="plants/:plantId" element={<SiteLayout />}>
            <Route index element={<SiteOverviewPage />} />
            <Route path="scada" element={<SiteScadaPage />} />
            <Route path="info" element={<SiteInfoPage />} />
            <Route path="device" element={<SiteDevicePage />} />
            <Route path="device/:deviceId" element={<DeviceDetailPage />} />
            <Route path="alarm" element={<SiteAlarmPage />} />
            <Route path="om-schedule" element={<SiteOmPage />} />
          </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}
