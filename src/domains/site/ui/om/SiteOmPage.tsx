import { Plus } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
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
import { formatDateKey, toDateKey } from "@/shared/domain/time";
import { cn } from "@/shared/lib/cn";
import { useNow } from "@/shared/lib/useNow";
import { Button } from "@/shared/ui/Button";
import { Drawer } from "@/shared/ui/Drawer";
import { Select } from "@/shared/ui/Input";
import { Pagination } from "@/shared/ui/Pagination";
import { Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Tabs } from "@/shared/ui/Tabs";
import { useSiteContext } from "../../application/use-site";
import { MaintenanceDetail } from "./MaintenanceDetail";
import { MaintenanceForm } from "./MaintenanceForm";

type StatusFilter = MaintenanceStatus | "ALL";
type TypeFilter = MaintenanceType | "ALL";

// Jadwal O&M satu plant: tabel aktivitas (filter status & tipe, paginasi), form tambah,
// dan panel detail per baris. Panel yang terbuka ada di URL (?new=1 / ?activity=id).
export function SiteOmPage() {
  const { plant } = useSiteContext();
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [type, setType] = useState<TypeFilter>("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_MAINTENANCE_QUERY.pageSize);
  const now = useNow();
  const plantId = plant?.id ?? "";
  const list = useMaintenance(plantId);

  const today = plant ? toDateKey(new Date(now), plant.location.timezone) : "";
  const items = useMemo(() => list.data ?? [], [list.data]);
  const result = useMemo(() => applyMaintenanceQuery(items, { type, status, page, pageSize }, today), [items, type, status, page, pageSize, today]);
  const ofType = type === "ALL" ? items.length : items.filter((i) => i.type === type).length;

  const creating = params.get("new") === "1";
  const openId = params.get("activity");
  const selected = openId ? items.find((a) => a.id === openId) : undefined;

  const closePanel = useCallback(() => {
    setParams(
      (prev) => {
        prev.delete("new");
        prev.delete("activity");
        return prev;
      },
      { replace: true },
    );
  }, [setParams]);
  const openCreate = () => setParams({ new: "1" });
  const openDetail = (id: string) => setParams({ activity: id });
  const onCreated = (a: MaintenanceActivity) => {
    setStatus("ALL");
    setType("ALL");
    setPage(1);
    setParams({ activity: a.id }, { replace: true });
  };

  if (!plant) return null;

  return (
    <>
      <Panel
        title="O&M schedule"
        actions={
          <Button variant="primary" onClick={openCreate}>
            <Plus className="size-4" aria-hidden />
            Tambah aktivitas
          </Button>
        }
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <Tabs
            className="border-b-0"
            value={status}
            onChange={(s) => {
              setStatus(s);
              setPage(1);
            }}
            items={[
              { value: "ALL", label: "Total", count: ofType },
              { value: "PENDING", label: "Pending", count: result.counts.PENDING },
              { value: "UPCOMING", label: "Upcoming", count: result.counts.UPCOMING },
              { value: "DONE", label: "Done", count: result.counts.DONE },
            ]}
          />
          <label className="flex items-center gap-2 text-xs text-muted">
            Type
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value as TypeFilter);
                setPage(1);
              }}
              aria-label="Filter tipe"
            >
              <option value="ALL">Semua tipe</option>
              {MAINTENANCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {MAINTENANCE_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </label>
        </div>

        {list.error && (
          <p role="alert" className="mb-3 text-sm">
            Jadwal O&M tidak bisa dimuat: {list.error.message}.{" "}
            <button type="button" onClick={() => void list.refetch()} className="text-accent underline-offset-2 hover:underline">
              Coba lagi
            </button>
          </p>
        )}

        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-200 text-left text-sm" aria-busy={list.isPending}>
            <caption className="sr-only">Jadwal pemeliharaan {plant.name}</caption>
            <thead className="bg-bg text-xs text-muted">
              <tr>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>O&M Activities</Th>
                <Th>Status</Th>
                <Th>Photo Documentation</Th>
                <Th>Notes</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.isPending &&
                Array.from({ length: 4 }, (_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }, (_, j) => (
                      <td key={j} className="px-3 py-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))}
              {!list.isPending && result.rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted">
                    {items.length === 0 ? (
                      <>
                        Belum ada aktivitas O&M untuk plant ini.{" "}
                        <button type="button" onClick={openCreate} className="text-accent underline-offset-2 hover:underline">
                          Tambah aktivitas pertama
                        </button>
                      </>
                    ) : (
                      <>
                        Tidak ada aktivitas dengan filter ini.{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setStatus("ALL");
                            setType("ALL");
                            setPage(1);
                          }}
                          className="text-accent underline-offset-2 hover:underline"
                        >
                          Tampilkan semua
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              )}
              {!list.isPending &&
                result.rows.map((a) => (
                  <tr key={a.id} onClick={() => openDetail(a.id)} className={cn("cursor-pointer hover:bg-surface-2/70", a.id === openId && "bg-surface-2/70")}>
                    <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs">{formatDateKey(a.date)}</td>
                    <td className="whitespace-nowrap px-3 py-2.5">{MAINTENANCE_TYPE_LABEL[a.type]}</td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(a.id);
                        }}
                        className="text-left font-medium underline-offset-2 hover:underline"
                      >
                        {a.activity}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <MaintenanceStatusBadge status={maintenanceStatus(a, today)} />
                    </td>
                    <td className="px-3 py-2.5">
                      {a.photos.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        <span className="flex items-center gap-1">
                          {a.photos.slice(0, 3).map((p) => (
                            <img key={p.id} src={p.dataUrl} alt="" className="size-8 rounded-sm border border-border object-cover" />
                          ))}
                          {a.photos.length > 3 && <span className="font-mono text-xs text-muted">+{a.photos.length - 3}</span>}
                          <span className="sr-only">{a.photos.length} foto</span>
                        </span>
                      )}
                    </td>
                    <td className="max-w-72 truncate px-3 py-2.5 text-muted" title={a.notes || undefined}>
                      {a.notes || "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <Pagination className="mt-4" page={result.page} pageSize={pageSize} totalItems={result.total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
      </Panel>

      <Drawer open={creating} onClose={closePanel} title="Tambah aktivitas O&M">
        {creating && <MaintenanceForm plant={plant} today={today} onCreated={onCreated} onCancel={closePanel} />}
      </Drawer>
      <Drawer open={!creating && openId !== null} onClose={closePanel} title="Detail aktivitas">
        {selected ? (
          <MaintenanceDetail key={selected.id} activity={selected} plant={plant} today={today} />
        ) : list.isPending ? (
          <Skeleton className="h-24 w-full" />
        ) : (
          <p className="text-sm text-muted">
            Aktivitas <span className="font-mono">{openId}</span> tidak ada di plant ini.
          </p>
        )}
      </Drawer>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-3 py-2.5 font-medium">{children}</th>;
}
