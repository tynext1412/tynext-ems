import { deviceStatus, type DeviceKind, type DeviceRecord, type DeviceStatus } from "./device";

export type DeviceStatusFilter = DeviceStatus | "ALL";

export interface DeviceListQuery {
  kind: DeviceKind;
  status: DeviceStatusFilter;
  search: string; // nama atau SN
  page: number;
  pageSize: number;
}

export const DEFAULT_DEVICE_LIST_QUERY: Omit<DeviceListQuery, "kind"> = {
  status: "ALL",
  search: "",
  page: 1,
  pageSize: 10,
};

export interface DeviceListPage<T extends DeviceRecord = DeviceRecord> {
  items: T[];
  page: number;
  totalItems: number;
  totalPages: number;
}

export function matchesDeviceSearch(d: Pick<DeviceRecord, "name" | "serialNumber" | "id">, search: string): boolean {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  return [d.name, d.serialNumber, d.id].some((f) => f.toLowerCase().includes(q));
}

export function applyDeviceListQuery(devices: readonly DeviceRecord[], query: DeviceListQuery): DeviceListPage {
  const filtered = devices.filter(
    (d) => d.kind === query.kind && (query.status === "ALL" || deviceStatus(d) === query.status) && matchesDeviceSearch(d, query.search),
  );
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name, "id", { numeric: true }));

  const pageSize = Math.max(1, query.pageSize);
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const start = (page - 1) * pageSize;

  return { items: sorted.slice(start, start + pageSize), page, totalItems: sorted.length, totalPages };
}

// Sidebar di halaman detail: perangkat sejenis (inverter/baterai/meter berdiri sendiri,
// tidak ada hierarki), difilter nama/SN dan diurutkan numerik.
export function sameKindDevices(devices: readonly DeviceRecord[], kind: DeviceKind, search: string): DeviceRecord[] {
  return devices.filter((d) => d.kind === kind && matchesDeviceSearch(d, search)).sort((a, b) => a.name.localeCompare(b.name, "id", { numeric: true }));
}
