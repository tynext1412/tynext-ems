import { Eye } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { usePlantDeviceReadings, usePlantDevices } from "@/domains/device/application/use-devices";
import { countDeviceStatus, DEVICE_KIND_LABEL, DEVICE_KINDS, deviceStatus, type DeviceKind, type DeviceRecord } from "@/domains/device/domain/device";
import { applyDeviceListQuery, DEFAULT_DEVICE_LIST_QUERY, type DeviceStatusFilter } from "@/domains/device/domain/device-list";
import type { DeviceReading } from "@/domains/device/domain/reading";
import { DeviceStatusBadge } from "@/domains/device/ui/DeviceStatusBadge";
import { MasterChip } from "@/domains/device/ui/MasterChip";
import type { Plant } from "@/domains/plant/domain/plant";
import { formatNumber, scaleEnergy } from "@/shared/domain/units";
import { Button } from "@/shared/ui/Button";
import { CopyButton } from "@/shared/ui/CopyButton";
import { DataTable, SkeletonRows, TableMessage, TBody, Td, Th, THead, Tr } from "@/shared/ui/DataTable";
import { EmptyState } from "@/shared/ui/EmptyState";
import { SearchField } from "@/shared/ui/Input";
import { Pagination } from "@/shared/ui/Pagination";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Tabs } from "@/shared/ui/Tabs";

function parseKind(raw: string | null): DeviceKind {
  const upper = (raw ?? "").toUpperCase();
  return (DEVICE_KINDS as readonly string[]).includes(upper) ? (upper as DeviceKind) : "INVERTER";
}

const STATUS_LABEL: Record<DeviceStatusFilter, string> = { ALL: "All", ONLINE: "Online", ALARM: "Alarm", OFFLINE: "Offline" };

// Daftar perangkat satu plant: tab tipe (di URL ?type=), pencarian, filter status, tabel per tipe.
export function DeviceListPanel({ plant }: { plant: Plant }) {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const kind = parseKind(params.get("type"));
  const [status, setStatus] = useState<DeviceStatusFilter>("ALL");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_DEVICE_LIST_QUERY.pageSize);

  const devices = usePlantDevices(plant.id);
  const readings = usePlantDeviceReadings(plant.id);

  const all = useMemo(() => devices.data ?? [], [devices.data]);
  const ofKind = useMemo(() => all.filter((d) => d.kind === kind), [all, kind]);
  const statusCount = useMemo(() => countDeviceStatus(ofKind), [ofKind]);
  const result = useMemo(() => applyDeviceListQuery(all, { kind, status, search, page, pageSize }), [all, kind, status, search, page, pageSize]);

  const changeKind = (next: DeviceKind) => {
    setParams(next === "INVERTER" ? {} : { type: next.toLowerCase() }, { replace: true });
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
  // Pencarian memuat ulang daftar dari server supaya hasilnya segar; selama itu tabel menampilkan skeleton.
  const applySearch = async () => {
    setSearch(searchDraft);
    setPage(1);
    setSearching(true);
    try {
      await devices.refetch();
    } finally {
      setSearching(false);
    }
  };

  const kindLabel = DEVICE_KIND_LABEL[kind];
  const message = (() => {
    if (devices.error) {
      return (
        <EmptyState
          illustration="server-error"
          title="Device list couldn't load"
          description={devices.error.message}
          action={
            <Button variant="primary" onClick={() => void devices.refetch()}>
              Retry
            </Button>
          }
        />
      );
    }
    if (result.totalItems > 0) return null;
    if (search.trim()) {
      return <EmptyState illustration="no-search-results" title={`No devices match “${search.trim()}”`} description="Periksa ejaan, atau coba nama atau serial number yang lain." action={<Button onClick={reset}>Clear search</Button>} />;
    }
    if (ofKind.length === 0) {
      return <EmptyState illustration="empty-sites" title={`No ${kindLabel.toLowerCase()} on this plant`} description={`Belum ada ${kindLabel.toLowerCase()} yang terdaftar untuk ${plant.name}.`} />;
    }
    const again = <Button onClick={() => void devices.refetch()}>Check again</Button>;
    if (status === "ALARM") return <EmptyState illustration="no-active-alarms" title={`No ${kindLabel.toLowerCase()} with active alarms`} action={again} />;
    if (status === "OFFLINE") return <EmptyState illustration="all-sites-online" title={`No offline ${kindLabel.toLowerCase()}`} description={`Semua ${kindLabel.toLowerCase()} sedang terhubung.`} action={again} />;
    return <EmptyState illustration="empty-sites" title={<span className="text-warn-text">No ${kindLabel.toLowerCase()} are online right now</span>} action={again} />;
  })();

  return (
    <div className="space-y-4">
      <Tabs
        value={kind}
        onChange={changeKind}
        aria-label="Tipe perangkat"
        items={DEVICE_KINDS.map((k) => ({ value: k, label: DEVICE_KIND_LABEL[k], count: all.filter((d) => d.kind === k).length }))}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchField value={searchDraft} onChange={setSearchDraft} onSubmit={() => void applySearch()} placeholder="Search name or serial number" aria-label="Cari perangkat" wrapperClassName="w-[280px] max-w-full" />
        <Button variant="primary" onClick={() => void applySearch()} loading={searching}>
          {searching ? "Searching" : "Search"}
        </Button>
        <Button onClick={reset}>Reset</Button>
        <Tabs
          variant="segmented"
          className="ml-auto"
          aria-label="Filter status perangkat"
          value={status}
          onChange={(s) => {
            setStatus(s);
            setPage(1);
          }}
          items={(["ALL", "ONLINE", "ALARM", "OFFLINE"] as const).map((s) => ({
            value: s,
            label: STATUS_LABEL[s],
            count: s === "ALL" ? ofKind.length : statusCount[s],
          }))}
        />
      </div>

      <DeviceTable
        kind={kind}
        rows={result.items}
        readings={readings.data ?? {}}
        loading={devices.isPending}
        searching={searching}
        readingsLoading={readings.isPending}
        onOpen={(id) => navigate(`/plants/${plant.id}/device/${id}`)}
        message={message}
        footer={
          <Pagination
            page={result.page}
            pageSize={pageSize}
            totalItems={result.totalItems}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setPageSize(s);
              setPage(1);
            }}
            disabled={devices.isPending || searching}
          />
        }
      />
    </div>
  );
}

interface TableProps {
  kind: DeviceKind;
  rows: DeviceRecord[];
  readings: Record<string, DeviceReading>;
  loading: boolean;
  searching: boolean;
  readingsLoading: boolean;
  onOpen: (id: string) => void;
  footer: ReactNode;
  message: ReactNode;
}

const COLUMNS: Record<DeviceKind, string[]> = {
  INVERTER: ["Status", "Name", "Inverter SN", "Rated Power", "Power", "Daily Yield", "Total Yield", "Action"],
  BATTERY: ["Status", "Name", "Battery SN", "Type", "Model", "SOC", "Daily Charge", "Daily Discharge", "Action"],
  PCS: ["Status", "Name", "PCS SN", "Rated Power", "Power", "Daily Charge", "Daily Discharge", "Coupled Batteries", "Action"],
  METER: ["Status", "Name", "Meter SN", "Device Original SN", "Power", "Daily Export", "Daily Import", "Associated Datalogger", "Action"],
};

function DeviceTable({ kind, rows, readings, loading, searching, readingsLoading, onOpen, footer, message }: TableProps) {
  const columns = COLUMNS[kind];
  const live = (deviceId: string, render: (r: DeviceReading) => ReactNode) => {
    const r = readings[deviceId];
    if (r) return render(r);
    return readingsLoading ? <Skeleton className="h-4 w-16" /> : <span className="text-muted">–</span>;
  };

  return (
    <DataTable stickyAction minWidth="1120px" caption={`Daftar ${DEVICE_KIND_LABEL[kind].toLowerCase()}`} footer={footer} busy={loading || searching}>
      <THead>
        <tr>
          {columns.map((c, i) => (
            <Th key={c} className={i === columns.length - 1 ? "w-20 text-center" : undefined}>
              {c}
            </Th>
          ))}
        </tr>
      </THead>
      <TBody>
        {loading && <SkeletonRows rows={10} cols={columns.length} />}
        {!loading && searching && <SkeletonRows rows={5} cols={columns.length} />}
        {!loading && !searching && message && <TableMessage cols={columns.length}>{message}</TableMessage>}
        {!loading &&
          !searching &&
          !message &&
          rows.map((d) => (
            <Tr key={d.id} className="hover:bg-bg/60">
              <Td>
                <DeviceStatusBadge status={deviceStatus(d)} />
              </Td>
              <Td>
                <span className="inline-flex items-center gap-2 font-medium text-text">
                  {d.name}
                  {d.kind === "INVERTER" && d.isMaster && <MasterChip />}
                </span>
              </Td>
              <Td>
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-mono font-medium text-text">{d.serialNumber}</span>
                  <CopyButton value={d.serialNumber} label="serial number" />
                </span>
              </Td>
              {d.kind === "INVERTER" && (
                <>
                  <Td className="font-mono">{formatNumber(d.ratedPowerKW, 0)} kW</Td>
                  <Td className="font-mono">{live(d.id, (r) => r.kind === "INVERTER" && `${formatNumber(r.powerKW, 1)} kW`)}</Td>
                  <Td className="font-mono">{live(d.id, (r) => r.kind === "INVERTER" && energy(r.dailyYieldKWh))}</Td>
                  <Td className="font-mono">{live(d.id, (r) => r.kind === "INVERTER" && energy(r.totalYieldKWh))}</Td>
                </>
              )}
              {d.kind === "BATTERY" && (
                <>
                  <Td>{d.batteryType}</Td>
                  <Td>{d.model}</Td>
                  <Td className="font-mono">{live(d.id, (r) => r.kind === "BATTERY" && `${r.socPercent}%`)}</Td>
                  <Td className="font-mono">{live(d.id, (r) => r.kind === "BATTERY" && energy(r.dailyChargeKWh))}</Td>
                  <Td className="font-mono">{live(d.id, (r) => r.kind === "BATTERY" && energy(r.dailyDischargeKWh))}</Td>
                </>
              )}
              {d.kind === "PCS" && (
                <>
                  <Td className="font-mono">{formatNumber(d.ratedPowerKW, 0)} kW</Td>
                  <Td className="font-mono">{live(d.id, (r) => r.kind === "PCS" && `${formatNumber(r.powerKW, 1)} kW`)}</Td>
                  <Td className="font-mono">{live(d.id, (r) => r.kind === "PCS" && energy(r.dailyChargeKWh))}</Td>
                  <Td className="font-mono">{live(d.id, (r) => r.kind === "PCS" && energy(r.dailyDischargeKWh))}</Td>
                  <Td className="font-mono">{d.coupledBatteryIds.length > 0 ? d.coupledBatteryIds.map((id) => id.split("-").slice(-2).join("-")).join(", ") : "–"}</Td>
                </>
              )}
              {d.kind === "METER" && (
                <>
                  <Td className="font-mono">{d.originalSerialNumber ?? <span className="text-muted">–</span>}</Td>
                  <Td className="font-mono">{live(d.id, (r) => r.kind === "METER" && `${formatNumber(r.activePowerKW, 1)} kW`)}</Td>
                  <Td className="font-mono">{live(d.id, (r) => r.kind === "METER" && energy(r.dailyExportKWh))}</Td>
                  <Td className="font-mono">{live(d.id, (r) => r.kind === "METER" && energy(r.dailyImportKWh))}</Td>
                  <Td className="font-mono">{d.dataloggerId}</Td>
                </>
              )}
              <Td align="center">
                <Button iconOnly size="sm" variant="tertiary" onClick={() => onOpen(d.id)} aria-label={`Buka detail ${d.name}`} title="Lihat detail perangkat">
                  <Eye className="size-4" aria-hidden />
                </Button>
              </Td>
            </Tr>
          ))}
      </TBody>
    </DataTable>
  );
}

function energy(kWh: number): string {
  const s = scaleEnergy(kWh);
  return `${s.value} ${s.unit}`;
}
