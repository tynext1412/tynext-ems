import { useSiteContext } from "../application/use-site";
import { DeviceListPanel } from "./device/DeviceListPanel";

export function SiteDevicePage() {
  const { plant } = useSiteContext();
  if (!plant) return null;
  return <DeviceListPanel plant={plant} />;
}
