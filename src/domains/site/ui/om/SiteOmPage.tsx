import { Eye, Plus } from "lucide-react";
import { useCallback, useId, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMaintenance } from "@/domains/maintenance/application/use-maintenance";
import {
  applyMaintenanceQuery,
  DEFAULT_MAINTENANCE_QUERY,
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
import { MaintenanceDetailDrawer } from "./MaintenanceDetail";
import { MaintenanceFormDrawer } from "./MaintenanceForm";
import { formatScheduleDate } from "./om-format";

type StatusFilter = MaintenanceStatus | "ALL";
type TypeFilter = MaintenanceType | "ALL";
const COLUMNS = 7;

// Jadwal O&M satu plant: tab status, pencarian, filter tipe, tabel dengan paginasi, dan drawer
// tambah / detail / edit. Panel yang terbuka ada di URL (?new=1, ?activity=id, ?activity=id&edit=1).
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

  const creating = params.get("new") === "1";
  const openId = params.get("activity");
  const editing = openId !== null && params.get("edit") === "1";
  const selected = openId ? items.find((a) => a.id === openId) : undefined;

  const closePanel = useCallback(() => {
    setParams(
      (prev) => {
        prev.delete("new");
        prev.delete("activity");
        prev.delete("edit");
        return prev;
      },
      { replace: true },
    );
  }, [setParams]);
  const openCreate = () => setParams({ new: "1" });
  const openDetail = (id: string) => setParams({ activity: id });
  const openEdit = (id: string) => setParams({ activity: id, edit: "1" });
  const onSaved = (a: MaintenanceActivity) => {
    setStatus("ALL");
    setType("ALL");
    setSearch("");
    setSearchDraft("");
    setPage(1);
    setParams({ activity: a.id }, { replace: true });
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
    if (result.rows.length > 0) return null;
    if (items.length === 0) {
      return (
        <EmptyState
          illustration="maintenance"
          title="No activities yet"
          description="Jadwalkan pemeliharaan pertama untuk plant ini."
          action={
            <Button variant="primary" onClick={openCreate}>
              <Plus className="size-4" aria-hidden />
              Add Activity
            </Button>
          }
        />
      );
    }
    if (hasQuery) {
      return <EmptyState illustration="no-search-results" title="No activities match your search" description="Coba kata kunci lain atau hapus filter." action={<Button onClick={resetAll}>Clear filters</Button>} />;
    }
    return <EmptyState illustration="maintenance" title={`No ${status.toLowerCase()} activities`} description="Tidak ada aktivitas dengan status ini." action={<Button onClick={() => setStatus("ALL")}>Show all</Button>} />;
  })();

  return (
    <>
      <SiteHeaderActions>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="size-4" aria-hidden />
          Add Activity
        </Button>
      </SiteHeaderActions>

      <div className="space-y-4">
        <Tabs
          aria-label="Status aktivitas"
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
          <SearchField value={searchDraft} onChange={setSearchDraft} onSubmit={applySearch} placeholder="Search activities description" aria-label="Cari aktivitas" wrapperClassName="w-[280px] max-w-full" />
          <Button variant="primary" onClick={applySearch}>
            Search
          </Button>
          <Button onClick={resetAll}>Reset</Button>
          <div className="ml-auto">
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
        ) : (
          <DataTable
            stickyAction
            minWidth="1000px"
            caption={`Jadwal pemeliharaan ${plant.name}`}
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
                          <span className="sr-only">{a.photos.length} foto</span>
                        </span>
                      )}
                    </Td>
                    <Td>
                      <span className="block max-w-[200px] truncate" title={a.notes || undefined}>
                        {a.notes || "-"}
                      </span>
                    </Td>
                    <Td align="center">
                      <Button iconOnly size="sm" variant="tertiary" onClick={() => openDetail(a.id)} aria-label={`Buka detail ${a.activity}`} title="Lihat detail aktivitas">
                        <Eye className="size-4" aria-hidden />
                      </Button>
                    </Td>
                  </Tr>
                ))}
            </TBody>
          </DataTable>
        )}
      </div>

      <MaintenanceFormDrawer open={creating} onClose={closePanel} plant={plant} today={today} onSaved={onSaved} />
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
