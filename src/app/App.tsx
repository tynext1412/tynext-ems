import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthLayout } from "@/domains/auth/ui/AuthLayout";
import { ForgotPasswordPage } from "@/domains/auth/ui/ForgotPasswordPage";
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
import { AppErrorBoundary } from "./AppErrorBoundary";
import { createRepositories } from "./container";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AppProviders } from "./providers";

const repositories = createRepositories();

export function App() {
  return (
    <AppProviders repositories={repositories}>
      <BrowserRouter>
        <AppErrorBoundary>
          <Routes>
            <Route element={<AuthLayout />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="forgot-password/:step" element={<ForgotPasswordPage />} />
            </Route>
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
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AppErrorBoundary>
      </BrowserRouter>
    </AppProviders>
  );
}
