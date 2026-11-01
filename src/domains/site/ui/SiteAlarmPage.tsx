import { useId, useMemo, useState } from "react";
import { sortAlarms, type Alarm, type AlarmSeverity } from "@/domains/alarm/domain/alarm";
import {
  ALARM_DEVICE_TYPE_LABEL,
  ALARM_DEVICE_TYPES,
  ALARM_LEVEL_LABEL,
  ALARM_SEVERITIES,
  alarmDurationMs,
  DEFAULT_ALARM_FILTER,
  deviceTypeFromId,
  formatAlarmTime,
  formatDuration,
  matchesAlarmFilter,
  splitAlarms,
  type AlarmDeviceType,
  type AlarmFilter,
} from "@/domains/alarm/domain/alarm-presentation";
import { usePlantDevices } from "@/domains/device/application/use-devices";
import { useNow } from "@/shared/lib/useNow";
import { Button } from "@/shared/ui/Button";
import { Chip, type ChipTone } from "@/shared/ui/Chip";
import { CopyButton } from "@/shared/ui/CopyButton";
import { DataTable, SkeletonRows, TableMessage, TBody, Td, Th, THead, Tr } from "@/shared/ui/DataTable";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Field, SearchField, Select } from "@/shared/ui/Input";
import { Pagination } from "@/shared/ui/Pagination";
import { Tabs } from "@/shared/ui/Tabs";
import { useSiteContext } from "../application/use-site";
import { FilterPopover } from "./om/FilterPopover";

type Tab = "active" | "recovered";

const LEVEL_TONE: Record<AlarmSeverity, ChipTone> = { CRITICAL: "danger", WARNING: "warn", INFO: "accent" };
const COLUMNS = 8;

// Halaman Alarm: tab Active/Recovered, pencarian + filter, tabel dengan paginasi, dan empty state.
export function SiteAlarmPage() {
  const { plant, alarms, isPending } = useSiteContext();
  const devices = usePlantDevices(plant?.id ?? "");
  const now = useNow();
  const typeId = useId();
  const levelId = useId();

  const [tab, setTab] = useState<Tab>("active");
  const [searchDraft, setSearchDraft] = useState("");
  const [applied, setApplied] = useState<AlarmFilter>(DEFAULT_ALARM_FILTER);
  const [draftType, setDraftType] = useState<AlarmFilter["deviceType"]>("ALL");
  const [draftLevel, setDraftLevel] = useState<AlarmFilter["severity"]>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Serial number dari daftar device plant; alarm sendiri hanya membawa id device.
  const serialById = useMemo(() => new Map((devices.data ?? []).map((d) => [d.id, d.serialNumber])), [devices.data]);
  const { active, recovered } = useMemo(() => splitAlarms(sortAlarms(alarms)), [alarms]);
  const source = tab === "active" ? active : recovered;
  const filtered = useMemo(() => source.filter((a) => matchesAlarmFilter(a, applied, serialById.get(a.deviceId))), [source, applied, serialById]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (!plant) return null;
  const tz = plant.location.timezone;
  const activeFilters = (applied.deviceType !== "ALL" ? 1 : 0) + (applied.severity !== "ALL" ? 1 : 0);
  const hasQuery = applied.search.trim() !== "" || activeFilters > 0;

  const changeTab = (next: Tab) => {
    setTab(next);
    setPage(1);
  };
  const applySearch = () => {
    setApplied((f) => ({ ...f, search: searchDraft }));
    setPage(1);
  };
  const resetAll = () => {
    setSearchDraft("");
    setApplied(DEFAULT_ALARM_FILTER);
    setDraftType("ALL");
    setDraftLevel("ALL");
    setPage(1);
  };

  const message = (() => {
    if (filtered.length > 0) return null;
    if (hasQuery) {
      return <EmptyState illustration="no-search-results" title="No alarms match your search" description="Try another device, serial number, or alarm content, or clear the filters." action={<Button onClick={resetAll}>Clear filters</Button>} />;
    }
    return tab === "active" ? (
      <EmptyState illustration="no-active-alarms" title="No active alarms" description="All devices at this plant are reporting normally. New alarms will show up here as soon as they are triggered." className="py-16" />
    ) : (
      <EmptyState illustration="session-expired" title="No recovered alarms yet" description="Alarms that have been resolved will appear here together with their recovery time." className="py-16" />
    );
  })();

  return (
    <div className="space-y-4">
      <Tabs
        aria-label="Status alarm"
        value={tab}
        onChange={changeTab}
        items={[
          { value: "active", label: "Active", count: active.length },
          { value: "recovered", label: "Recovered", count: recovered.length },
        ]}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchField value={searchDraft} onChange={setSearchDraft} onSubmit={applySearch} placeholder="Search name or serial number" aria-label="Search alarms" wrapperClassName="w-[280px] max-w-full" />
        <Button variant="primary" onClick={applySearch}>
          Search
        </Button>
        <Button onClick={resetAll}>Reset</Button>
        <div className="ml-auto">
          <FilterPopover
            activeCount={activeFilters}
            onOpen={() => {
              setDraftType(applied.deviceType);
              setDraftLevel(applied.severity);
            }}
            onApply={() => {
              setApplied((f) => ({ ...f, deviceType: draftType, severity: draftLevel }));
              setPage(1);
            }}
            onReset={() => {
              setDraftType("ALL");
              setDraftLevel("ALL");
              setApplied((f) => ({ ...f, deviceType: "ALL", severity: "ALL" }));
              setPage(1);
            }}
          >
            <Field id={typeId} label="Device Type">
              <Select id={typeId} value={draftType} onChange={(e) => setDraftType(e.target.value as AlarmDeviceType | "ALL")} wrapperClassName="w-full">
                <option value="ALL">All device types</option>
                {ALARM_DEVICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ALARM_DEVICE_TYPE_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id={levelId} label="Alarm Level">
              <Select id={levelId} value={draftLevel} onChange={(e) => setDraftLevel(e.target.value as AlarmSeverity | "ALL")} wrapperClassName="w-full">
                <option value="ALL">All levels</option>
                {ALARM_SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {ALARM_LEVEL_LABEL[s]}
                  </option>
                ))}
              </Select>
            </Field>
          </FilterPopover>
        </div>
      </div>

      {message && !isPending ? (
        <div className="rounded-2xl border border-separator bg-surface">{message}</div>
      ) : (
        <DataTable
          minWidth="1400px"
          caption={`Alarm ${plant.name}`}
          busy={isPending}
          footer={<Pagination page={currentPage} pageSize={pageSize} totalItems={filtered.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} disabled={isPending} />}
        >
          <THead>
            <tr>
              <Th width={120}>Level</Th>
              <Th width={140}>Status</Th>
              <Th width={140}>Device Type</Th>
              <Th width={220}>SN</Th>
              <Th width={370}>Alarm Content</Th>
              <Th width={180}>Alarm Time</Th>
              <Th width={180}>Recovery Time</Th>
              <Th width={190}>Alarm Duration</Th>
            </tr>
          </THead>
          <TBody>
            {isPending && <SkeletonRows rows={5} cols={COLUMNS} />}
            {!isPending && message && <TableMessage cols={COLUMNS}>{message}</TableMessage>}
            {!isPending && !message && rows.map((a) => <AlarmRow key={a.id} alarm={a} serial={serialById.get(a.deviceId)} timeZone={tz} now={now} />)}
          </TBody>
        </DataTable>
      )}
    </div>
  );
}

function AlarmRow({ alarm, serial, timeZone, now }: { alarm: Alarm; serial?: string; timeZone: string; now: number }) {
  const sn = serial ?? alarm.deviceId;
  const recovered = Boolean(alarm.clearedAt);
  return (
    <Tr className="hover:bg-bg/60">
      <Td>
        <Chip tone={LEVEL_TONE[alarm.severity]} className={alarm.severity === "WARNING" ? "text-text" : undefined}>
          {ALARM_LEVEL_LABEL[alarm.severity]}
        </Chip>
      </Td>
      <Td>
        <Chip variant="soft" tone={recovered ? "ok" : "warn"}>
          {recovered ? "Recovered" : "Active"}
        </Chip>
      </Td>
      <Td>{ALARM_DEVICE_TYPE_LABEL[deviceTypeFromId(alarm.deviceId)]}</Td>
      <Td>
        <span className="flex items-center gap-1.5">
          <span className="font-mono font-medium">{sn}</span>
          <CopyButton value={sn} label="serial number" />
        </span>
      </Td>
      <Td className="whitespace-normal">
        <span className="line-clamp-2 min-w-[240px] max-w-[370px]" title={alarm.message}>
          {alarm.message}
        </span>
      </Td>
      <Td>{formatAlarmTime(alarm.raisedAt, timeZone)}</Td>
      <Td className={recovered ? undefined : "text-muted"}>{alarm.clearedAt ? formatAlarmTime(alarm.clearedAt, timeZone) : "Not recovered yet"}</Td>
      <Td>
        <span className="flex items-center gap-2">
          {formatDuration(alarmDurationMs(alarm, now))}
          {!recovered && (
            <Chip size="sm" variant="soft" tone="neutral" className="text-text">
              ongoing
            </Chip>
          )}
        </span>
      </Td>
    </Tr>
  );
}
