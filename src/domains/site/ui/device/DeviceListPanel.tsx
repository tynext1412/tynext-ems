import { Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  usePlantDeviceReadings,
  usePlantDevices,
} from "@/domains/device/application/use-devices";
import {
  countDeviceStatus,
  DEVICE_KIND_LABEL,
  DEVICE_KINDS,
  deviceStatus,
  type DeviceKind,
  type DeviceRecord,
} from "@/domains/device/domain/device";
import {
  applyDeviceListQuery,
  DEFAULT_DEVICE_LIST_QUERY,
  type DeviceStatusFilter,
} from "@/domains/device/domain/device-list";
import type { DeviceReading } from "@/domains/device/domain/reading";
import { DeviceStatusBadge } from "@/domains/device/ui/DeviceStatusBadge";
import { MasterChip } from "@/domains/device/ui/MasterChip";
import type { Plant } from "@/domains/plant/domain/plant";
import { formatDateKey } from "@/shared/domain/time";
import { formatNumber, scaleEnergy } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Pagination } from "@/shared/ui/Pagination";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Tabs } from "@/shared/ui/Tabs";

function parseKind(raw: string | null): DeviceKind {
  const upper = (raw ?? "").toUpperCase();
  return (DEVICE_KINDS as readonly string[]).includes(upper)
    ? (upper as DeviceKind)
    : "INVERTER";
}

// Daftar perangkat satu plant: tab tipe (di URL ?type=), sub-tab status, pencarian, tabel per tipe.
export function DeviceListPanel({ plant }: { plant: Plant }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const kind = parseKind(params.get("type"));
  const [status, setStatus] = useState<DeviceStatusFilter>("ALL");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_DEVICE_LIST_QUERY.pageSize);

  const devices = usePlantDevices(plant.id);
  const readings = usePlantDeviceReadings(plant.id);

  const all = useMemo(() => devices.data ?? [], [devices.data]);
  const ofKind = useMemo(() => all.filter((d) => d.kind === kind), [all, kind]);
  const statusCount = useMemo(() => countDeviceStatus(ofKind), [ofKind]);
  const result = useMemo(
    () => applyDeviceListQuery(all, { kind, status, search, page, pageSize }),
    [all, kind, status, search, page, pageSize],
  );

  const changeKind = (next: DeviceKind) => {
    setParams(next === "INVERTER" ? {} : { type: next.toLowerCase() }, {
      replace: true,
    });
    setStatus("ALL");
    setSearch("");
    setSearchDraft("");
    setPage(1);
  };
  const reset = () => {
    setStatus("ALL");
    setSearch("");
    setSearchDraft("");
    setPage(1);
  };

  return (
    <Panel title="Device">
      <Tabs
        className="mb-3"
        value={kind}
        onChange={changeKind}
        items={DEVICE_KINDS.map((k) => ({
          value: k,
          label: DEVICE_KIND_LABEL[k],
          count: all.filter((d) => d.kind === k).length,
        }))}
      />
      <Tabs
        className="mb-4 border-b-0"
        value={status}
        onChange={(s) => {
          setStatus(s);
          setPage(1);
        }}
        items={[
          { value: "ALL", label: "Total", count: ofKind.length },
          { value: "ONLINE", label: "Online", count: statusCount.ONLINE },
          { value: "ALARM", label: "Alarm", count: statusCount.ALARM },
          { value: "OFFLINE", label: "Offline", count: statusCount.OFFLINE },
        ]}
      />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Search
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              className="w-72 max-w-full pl-8"
              placeholder="Nama atau serial number"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setSearch(searchDraft);
                  setPage(1);
                }
              }}
            />
          </div>
        </label>
        <Button
          variant="primary"
          onClick={() => {
            setSearch(searchDraft);
            setPage(1);
          }}
        >
          Search
        </Button>
        <Button onClick={reset}>Reset</Button>
      </div>

      {devices.error && (
        <div
          role="alert"
          className="mb-3 flex flex-wrap items-center gap-3 text-sm"
        >
          <span>
            Daftar perangkat tidak bisa dimuat: {devices.error.message}.
          </span>
          <Button onClick={() => void devices.refetch()} className="h-9">
            Coba muat ulang
          </Button>
        </div>
      )}

      <DeviceTable
        kind={kind}
        rows={result.items}
        readings={readings.data ?? {}}
        loading={devices.isPending}
        readingsLoading={readings.isPending}
        onOperation={(id) => navigate(`/plants/${plant.id}/device/${id}`)}
        onClear={reset}
      />

      <Pagination
        className="mt-4"
        page={result.page}
        pageSize={pageSize}
        totalItems={result.totalItems}
        onPageChange={setPage}
        onPageSizeChange={(s) => {
          setPageSize(s);
          setPage(1);
        }}
      />
    </Panel>
  );
}

interface TableProps {
  kind: DeviceKind;
  rows: DeviceRecord[];
  readings: Record<string, DeviceReading>;
  loading: boolean;
  readingsLoading: boolean;
  onOperation: (id: string) => void;
  onClear: () => void;
}

const COLUMNS: Record<DeviceKind, string[]> = {
  INVERTER: [
    "Status",
    "Name",
    "Inverter SN",
    "Rated Power",
    "Power",
    "Daily Yield",
    "Total Yield",
    "Warranty Expiry",
    "Operation",
  ],
  BATTERY: [
    "Status",
    "Name",
    "Battery SN",
    "Type",
    "Model",
    "SOC",
    "Daily Charge",
    "Daily Discharge",
    "Operation",
  ],
  PCS: ["Status", "Name", "PCS SN", "Rated Power", "Power", "Daily Charge", "Daily Discharge", "Coupled Batteries", "Operation"],
  METER: [
    "Status",
    "Name",
    "Meter SN",
    "Device Original SN",
    "Power",
    "Daily Export",
    "Daily Import",
    "Associated Datalogger",
    "Operation",
  ],
};

function DeviceTable({
  kind,
  rows,
  readings,
  loading,
  readingsLoading,
  onOperation,
  onClear,
}: TableProps) {
  const columns = COLUMNS[kind];
  const live = (deviceId: string, render: (r: DeviceReading) => ReactNode) => {
    const r = readings[deviceId];
    if (r) return render(r);
    return readingsLoading ? (
      <Skeleton className="h-4 w-16" />
    ) : (
      <span className="text-muted">n/a</span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-240 text-left text-sm">
        <thead className="bg-bg text-xs text-muted">
          <tr>
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-3 py-2.5 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading &&
            Array.from({ length: 4 }, (_, i) => (
              <tr key={i} aria-hidden>
                <td colSpan={columns.length} className="px-3 py-3">
                  <Skeleton className="h-5 w-full" />
                </td>
              </tr>
            ))}
          {!loading && rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-10 text-center text-muted"
              >
                Tidak ada {DEVICE_KIND_LABEL[kind].toLowerCase()} yang cocok
                dengan filter.{" "}
                <button
                  type="button"
                  onClick={onClear}
                  className="text-accent underline-offset-2 hover:underline"
                >
                  Tampilkan semua
                </button>
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((d) => (
              <tr key={d.id} className="hover:bg-surface-2/70">
                <Td>
                  <DeviceStatusBadge status={deviceStatus(d)} />
                </Td>
                <Td>
                  <span className="inline-flex items-center gap-2">
                    {d.name}
                    {d.kind === "INVERTER" && d.isMaster && <MasterChip />}
                  </span>
                </Td>
                <Td mono>{d.serialNumber}</Td>
                {d.kind === "INVERTER" && (
                  <>
                    <Td mono>{formatNumber(d.ratedPowerKW, 0)} kW</Td>
                    <Td mono>
                      {live(
                        d.id,
                        (r) =>
                          r.kind === "INVERTER" &&
                          `${formatNumber(r.powerKW, 1)} kW`,
                      )}
                    </Td>
                    <Td mono>
                      {live(
                        d.id,
                        (r) => r.kind === "INVERTER" && energy(r.dailyYieldKWh),
                      )}
                    </Td>
                    <Td mono>
                      {live(
                        d.id,
                        (r) => r.kind === "INVERTER" && energy(r.totalYieldKWh),
                      )}
                    </Td>
                    <Td mono>{formatDateKey(d.warrantyExpiresAt)}</Td>
                  </>
                )}
                {d.kind === "BATTERY" && (
                  <>
                    <Td>{d.batteryType}</Td>
                    <Td>{d.model}</Td>
                    <Td mono>
                      {live(
                        d.id,
                        (r) => r.kind === "BATTERY" && `${r.socPercent}%`,
                      )}
                    </Td>
                    <Td mono>
                      {live(
                        d.id,
                        (r) => r.kind === "BATTERY" && energy(r.dailyChargeKWh),
                      )}
                    </Td>
                    <Td mono>
                      {live(
                        d.id,
                        (r) =>
                          r.kind === "BATTERY" && energy(r.dailyDischargeKWh),
                      )}
                    </Td>
                  </>
                )}
                {d.kind === "PCS" && (
                  <>
                    <Td mono>{formatNumber(d.ratedPowerKW, 0)} kW</Td>
                    <Td mono>{live(d.id, (r) => r.kind === "PCS" && `${formatNumber(r.powerKW, 1)} kW`)}</Td>
                    <Td mono>{live(d.id, (r) => r.kind === "PCS" && energy(r.dailyChargeKWh))}</Td>
                    <Td mono>{live(d.id, (r) => r.kind === "PCS" && energy(r.dailyDischargeKWh))}</Td>
                    <Td mono>{d.coupledBatteryIds.length > 0 ? d.coupledBatteryIds.map((id) => id.split("-").slice(-2).join("-")).join(", ") : "—"}</Td>
                  </>
                )}
                {d.kind === "METER" && (
                  <>
                    <Td mono>
                      {d.originalSerialNumber ?? (
                        <span className="text-muted">n/a</span>
                      )}
                    </Td>
                    <Td mono>
                      {live(
                        d.id,
                        (r) =>
                          r.kind === "METER" &&
                          `${formatNumber(r.activePowerKW, 1)} kW`,
                      )}
                    </Td>
                    <Td mono>
                      {live(
                        d.id,
                        (r) => r.kind === "METER" && energy(r.dailyExportKWh),
                      )}
                    </Td>
                    <Td mono>
                      {live(
                        d.id,
                        (r) => r.kind === "METER" && energy(r.dailyImportKWh),
                      )}
                    </Td>
                    <Td mono>{d.dataloggerId}</Td>
                  </>
                )}
                <Td>
                  <Button onClick={() => onOperation(d.id)} className="h-9">
                    Operation
                  </Button>
                </Td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

function energy(kWh: number): string {
  const s = scaleEnergy(kWh);
  return `${s.value} ${s.unit}`;
}

function Td({
  children,
  mono,
  className,
}: {
  children: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <td
      className={cn(
        "whitespace-nowrap px-3 py-2.5 align-middle",
        mono && "font-mono",
        className,
      )}
    >
      {children}
    </td>
  );
}
