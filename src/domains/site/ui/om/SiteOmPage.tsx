import { CalendarDays, Eye, List, Plus } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMaintenance } from "@/domains/maintenance/application/use-maintenance";
import {
  applyMaintenanceQuery,
  DEFAULT_MAINTENANCE_QUERY,
  filterMaintenance,
  MAINTENANCE_TYPE_LABEL,
  MAINTENANCE_TYPES,
  maintenanceStatus,
  type MaintenanceActivity,
  type MaintenanceStatus,
  type MaintenanceType,
} from "@/domains/maintenance/domain/maintenance";
import { MaintenanceStatusBadge } from "@/domains/maintenance/ui/MaintenanceStatusBadge";
import { MaintenanceTypeTag } from "@/domains/maintenance/ui/MaintenanceTypeTag";
import { toDateKey } from "@/shared/domain/time";
import { useNow } from "@/shared/lib/useNow";
import { Button } from "@/shared/ui/Button";
import { DataTable, SkeletonRows, TableMessage, TBody, Td, Th, THead, Tr } from "@/shared/ui/DataTable";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Field, SearchField, Select } from "@/shared/ui/Input";
import { Pagination } from "@/shared/ui/Pagination";
import { Tabs } from "@/shared/ui/Tabs";
import { useSiteContext } from "../../application/use-site";
import { SiteHeaderActions } from "../SiteLayout";
import { FilterPopover } from "./FilterPopover";
import { MaintenanceCalendar } from "./MaintenanceCalendar";
import { MaintenanceDetailDrawer } from "./MaintenanceDetail";
import { MaintenanceFormDrawer } from "./MaintenanceForm";
import { formatScheduleDate } from "./om-format";

type StatusFilter = MaintenanceStatus | "ALL";
type ScheduleView = "list" | "calendar";
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
type TypeFilter = MaintenanceType | "ALL";
const COLUMNS = 7;

// Jadwal O&M satu plant: tab status, pencarian, filter tipe, tabel dengan paginasi, dan drawer
// tambah / detail / edit. Di tab All jadwal bisa dilihat sebagai list atau kalender (?view=calendar).
// Panel yang terbuka ada di URL (?new=1[&date=], ?activity=id, ?activity=id&edit=1).
export function SiteOmPage() {
  const { plant } = useSiteContext();
  const [params, setParams] = useSearchParams();
  const typeId = useId();
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [type, setType] = useState<TypeFilter>("ALL");
  const [draftType, setDraftType] = useState<TypeFilter>("ALL");
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_MAINTENANCE_QUERY.pageSize);
  const now = useNow();
  const plantId = plant?.id ?? "";
  const list = useMaintenance(plantId);

  const today = plant ? toDateKey(new Date(now), plant.location.timezone) : "";
  const items = useMemo(() => list.data ?? [], [list.data]);
  const result = useMemo(() => applyMaintenanceQuery(items, { type, status, search, page, pageSize }, today), [items, type, status, search, page, pageSize, today]);
  const allCount = result.counts.DONE + result.counts.PENDING + result.counts.UPCOMING;

  const filtered = useMemo(() => filterMaintenance(items, { type, search }), [items, type, search]);
  // Kalender hanya untuk tab All; tab status lain selalu list (pilihan tetap diingat di URL).
  const view: ScheduleView = status === "ALL" && params.get("view") === "calendar" ? "calendar" : "list";

  const creating = params.get("new") === "1";
  const createDate = params.get("date");
  const openId = params.get("activity");
  const editing = openId !== null && params.get("edit") === "1";
  const selected = openId ? items.find((a) => a.id === openId) : undefined;

  // Ganti parameter panel tanpa menghapus pilihan tampilan (?view=calendar).
  const setPanel = useCallback(
    (panel: Record<string, string>, replace = false) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(panel);
          const v = prev.get("view");
          if (v) next.set("view", v);
          return next;
        },
        { replace },
      ),
    [setParams],
  );
  const closePanel = useCallback(() => setPanel({}, true), [setPanel]);
  const openCreate = (date?: string) => setPanel(date ? { new: "1", date } : { new: "1" });
  const openDetail = (id: string) => setPanel({ activity: id });
  const openEdit = (id: string) => setPanel({ activity: id, edit: "1" });
  const changeView = (v: ScheduleView) =>
    setParams(
      (prev) => {
        if (v === "calendar") prev.set("view", "calendar");
        else prev.delete("view");
        return prev;
      },
      { replace: true },
    );
  const onSaved = (a: MaintenanceActivity) => {
    setStatus("ALL");
    setType("ALL");
    setSearch("");
    setSearchDraft("");
    setPage(1);
    setPanel({ activity: a.id }, true);
  };

  const applySearch = () => {
    setSearch(searchDraft);
    setPage(1);
  };
  const resetAll = () => {
    setStatus("ALL");
    setType("ALL");
    setDraftType("ALL");
    setSearch("");
    setSearchDraft("");
    setPage(1);
  };

  if (!plant) return null;
  const hasQuery = search.trim() !== "" || type !== "ALL";

  const message = (() => {
    if (list.error) {
      return (
        <EmptyState
          illustration="server-error"
          title="The schedule couldn't load"
          description={list.error.message}
          action={
            <Button variant="primary" onClick={() => void list.refetch()}>
              Retry
            </Button>
          }
        />
      );
    }
    if (view === "calendar" ? filtered.length > 0 : result.rows.length > 0) return null;
    if (items.length === 0) {
      return (
        <EmptyState
          illustration="maintenance"
          title="No activities yet"
          description="Schedule the first maintenance activity for this plant."
          action={
            <Button variant="primary" onClick={() => openCreate()}>
              <Plus className="size-4" aria-hidden />
              Add Activity
            </Button>
          }
        />
      );
    }
    if (hasQuery) {
      return <EmptyState illustration="no-search-results" title="No activities match your search" description="Try another keyword or clear the filters." action={<Button onClick={resetAll}>Clear filters</Button>} />;
    }
    return <EmptyState illustration="maintenance" title={`No ${status.toLowerCase()} activities`} description="There are no activities with this status." action={<Button onClick={() => setStatus("ALL")}>Show all</Button>} />;
  })();

  return (
    <>
      <SiteHeaderActions>
        <Button variant="primary" onClick={() => openCreate()}>
          <Plus className="size-4" aria-hidden />
          Add Activity
        </Button>
      </SiteHeaderActions>

      <div className="space-y-4">
        <Tabs
          aria-label="Activity status"
          value={status}
          onChange={(s) => {
            setStatus(s);
            setPage(1);
          }}
          items={[
            { value: "ALL", label: "All", count: allCount },
            { value: "PENDING", label: "Pending", count: result.counts.PENDING },
            { value: "UPCOMING", label: "Upcoming", count: result.counts.UPCOMING },
            { value: "DONE", label: "Done", count: result.counts.DONE },
          ]}
        />

        <div className="flex flex-wrap items-center gap-3">
          <SearchField value={searchDraft} onChange={setSearchDraft} onSubmit={applySearch} placeholder="Search activities description" aria-label="Search activities" wrapperClassName="w-[280px] max-w-full" />
          <Button variant="primary" onClick={applySearch}>
            Search
          </Button>
          <Button onClick={resetAll}>Reset</Button>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {status === "ALL" && (
              <Tabs
                variant="segmented"
                activeShadow="toggle"
                aria-label="Schedule view"
                value={view}
                onChange={changeView}
                items={[
                  { value: "list", label: "List", icon: <List /> },
                  { value: "calendar", label: "Calendar", icon: <CalendarDays /> },
                ]}
              />
            )}
            <FilterPopover
              activeCount={type === "ALL" ? 0 : 1}
              onOpen={() => setDraftType(type)}
              onApply={() => {
                setType(draftType);
                setPage(1);
              }}
              onReset={() => {
                setDraftType("ALL");
                setType("ALL");
                setPage(1);
              }}
            >
              <Field id={typeId} label="Type">
                <Select id={typeId} value={draftType} onChange={(e) => setDraftType(e.target.value as TypeFilter)} wrapperClassName="w-full">
                  <option value="ALL">All types</option>
                  {MAINTENANCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {MAINTENANCE_TYPE_LABEL[t]}
                    </option>
                  ))}
                </Select>
              </Field>
            </FilterPopover>
          </div>
        </div>

        {message && !list.isPending ? (
          <div className="rounded-2xl border border-separator bg-surface">{message}</div>
        ) : view === "calendar" ? (
          <MaintenanceCalendar items={filtered} today={today} loading={list.isPending} openId={openId} onOpen={openDetail} onCreate={openCreate} />
        ) : (
          <DataTable
            stickyAction
            minWidth="1000px"
            caption={`Maintenance schedule for ${plant.name}`}
            busy={list.isPending}
            footer={<Pagination page={result.page} pageSize={pageSize} totalItems={result.total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} disabled={list.isPending} itemLabel={result.total === 1 ? "result" : "results"} />}
          >
            <THead>
              <tr>
                <Th width={120}>Date</Th>
                <Th width={220}>Type</Th>
                <Th width={280}>O&M Activities</Th>
                <Th width={120}>Status</Th>
                <Th width={160}>Photo Documentation</Th>
                <Th width={180}>Notes</Th>
                <Th width={84} className="text-center">Action</Th>
              </tr>
            </THead>
            <TBody>
              {list.isPending && <SkeletonRows rows={5} cols={COLUMNS} />}
              {!list.isPending && message && <TableMessage cols={COLUMNS}>{message}</TableMessage>}
              {!list.isPending &&
                !message &&
                result.rows.map((a) => (
                  <Tr key={a.id} className={a.id === openId ? "bg-bg/60" : "hover:bg-bg/60"}>
                    <Td>{formatScheduleDate(a.date)}</Td>
                    <Td>
                      <MaintenanceTypeTag type={a.type} />
                    </Td>
                    <Td className="whitespace-normal">
                      <span className="line-clamp-2 min-w-[200px] max-w-[248px]" title={a.activity}>
                        {a.activity}
                      </span>
                    </Td>
                    <Td>
                      <MaintenanceStatusBadge status={maintenanceStatus(a, today)} />
                    </Td>
                    <Td>
                      {a.photos.length === 0 ? (
                        <span className="text-text">-</span>
                      ) : (
                        <span className="flex items-center gap-1">
                          {a.photos.slice(0, 3).map((p) => (
                            <img key={p.id} src={p.dataUrl} alt="" className="size-8 rounded-md border border-border object-cover" />
                          ))}
                          {a.photos.length > 3 && <span className="font-mono text-xs text-muted">+{a.photos.length - 3}</span>}
                          <span className="sr-only">{a.photos.length} {a.photos.length === 1 ? "photo" : "photos"}</span>
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span className="block max-w-[200px] truncate" title={a.notes || undefined}>
                        {a.notes || "-"}
                      </span>
                    </Td>
                    <Td align="center">
                      <Button iconOnly size="sm" variant="tertiary" onClick={() => openDetail(a.id)} aria-label={`Open details for ${a.activity}`} title="View activity details">
                        <Eye className="size-4" aria-hidden />
                      </Button>
                    </Td>
                  </Tr>
                ))}
            </TBody>
          </DataTable>
        )}
      </div>

      <MaintenanceFormDrawer open={creating} onClose={closePanel} plant={plant} today={today} initialDate={createDate && DATE_KEY.test(createDate) ? createDate : undefined} onSaved={onSaved} />
      <MaintenanceFormDrawer open={editing && selected !== undefined} onClose={() => openDetail(openId ?? "")} plant={plant} today={today} activity={selected} onSaved={onSaved} />
      <MaintenanceDetailDrawer
        open={!creating && openId !== null && !editing}
        onClose={closePanel}
        onEdit={() => openId && openEdit(openId)}
        activity={selected}
        activityId={openId}
        loading={list.isPending}
        plant={plant}
        today={today}
      />
    </>
  );
}
