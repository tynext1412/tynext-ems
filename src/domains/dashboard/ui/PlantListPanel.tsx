import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { StatusCount } from "@/domains/plant/domain/status-policy";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Pagination } from "@/shared/ui/Pagination";
import { Tabs, type TabItem } from "@/shared/ui/Tabs";
import { usePlantList } from "../application/use-plant-list";
import type { StatusFilter } from "../domain/plant-list";
import { PlantTable } from "./PlantTable";

interface Props {
  statusCount?: StatusCount;
}

// Isi bottom sheet: tab status, pencarian, tabel, paginasi.
export function PlantListPanel({ statusCount }: Props) {
  const navigate = useNavigate();
  const { query, page, update, toggleSort, reset, retry, isPending, error } = usePlantList();
  const [searchDraft, setSearchDraft] = useState("");
  const [expanded, setExpanded] = useState(false);

  const total = statusCount ? statusCount.ONLINE + statusCount.ALARM + statusCount.OFFLINE : undefined;
  const tabs: TabItem<StatusFilter>[] = [
    { value: "ALL", label: "Total", count: total },
    { value: "ONLINE", label: "Online", count: statusCount?.ONLINE },
    { value: "ALARM", label: "Alarm", count: statusCount?.ALARM },
    { value: "OFFLINE", label: "Offline", count: statusCount?.OFFLINE },
  ];

  const applySearch = () => update({ search: searchDraft });
  const resetAll = () => {
    setSearchDraft("");
    reset();
  };

  return (
    <div className="space-y-4">
      <Tabs items={tabs} value={query.status} onChange={(status) => update({ status })} />

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted">
          Search
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input
              className="w-72 max-w-full pl-8"
              placeholder="Nama plant, alamat, atau ID"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
            />
          </div>
        </label>
        <Button variant="primary" onClick={applySearch}>
          Search
        </Button>
        <Button onClick={resetAll}>Reset</Button>
        <Button variant="ghost" className="ml-auto" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          {expanded ? "Sembunyikan kolom kapasitas & energi" : "Tampilkan kolom kapasitas & energi"}
          {expanded ? <ChevronUp className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
        </Button>
      </div>

      {error && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-md border border-danger/50 bg-surface-2 px-4 py-3 text-sm">
          <span>Daftar plant tidak bisa dimuat: {error.message}.</span>
          <Button onClick={retry} className="h-9">
            Coba muat ulang
          </Button>
        </div>
      )}

      <PlantTable
        rows={page.items}
        expanded={expanded}
        loading={isPending}
        sortBy={query.sortBy}
        order={query.order}
        onSort={toggleSort}
        onOperation={(id) => navigate(`/plants/${id}`)}
        onClearFilters={resetAll}
      />

      <Pagination
        page={page.page}
        pageSize={query.pageSize}
        totalItems={page.totalItems}
        onPageChange={(p) => update({ page: p })}
        onPageSizeChange={(pageSize) => update({ pageSize })}
      />
    </div>
  );
}
