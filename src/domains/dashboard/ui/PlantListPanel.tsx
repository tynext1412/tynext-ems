import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { StatusCount } from "@/domains/plant/domain/status-policy";
import { Button } from "@/shared/ui/Button";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Checkbox, SearchField } from "@/shared/ui/Input";
import { Pagination } from "@/shared/ui/Pagination";
import { Tabs, type TabItem } from "@/shared/ui/Tabs";
import { usePlantList } from "../application/use-plant-list";
import type { StatusFilter } from "../domain/plant-list";
import { PlantTable } from "./PlantTable";

interface Props {
  statusCount?: StatusCount;
  onCheckAgain?: () => void;
}

// Isi sheet Site List: tab status, pencarian, toggle kolom, tabel, paginasi, dan semua state PRD.
export function PlantListPanel({ statusCount, onCheckAgain }: Props) {
  const navigate = useNavigate();
  const checkboxId = useId();
  const { query, page, update, search, searching, toggleSort, reset, retry, isPending, error } = usePlantList();
  const [searchDraft, setSearchDraft] = useState("");
  const [expanded, setExpanded] = useState(false);

  const total = statusCount ? statusCount.ONLINE + statusCount.ALARM + statusCount.OFFLINE : undefined;
  const tabs: TabItem<StatusFilter>[] = [
    { value: "ALL", label: "All", count: total },
    { value: "ONLINE", label: "Online", count: statusCount?.ONLINE },
    { value: "ALARM", label: "Alarm", count: statusCount?.ALARM },
    { value: "OFFLINE", label: "Offline", count: statusCount?.OFFLINE },
  ];

  const applySearch = () => void search(searchDraft);
  const resetAll = () => {
    setSearchDraft("");
    reset();
  };
  const checkAgain = () => {
    retry();
    onCheckAgain?.();
  };

  const message = (() => {
    if (error) {
      return (
        <EmptyState
          illustration="server-error"
          title="The site list couldn't load"
          description={error.message}
          action={
            <Button variant="primary" onClick={retry}>
              Retry
            </Button>
          }
        />
      );
    }
    if (page.totalItems > 0) return null;
    if (query.search.trim()) {
      return (
        <EmptyState
          illustration="no-search-results"
          title={`No sites match “${query.search.trim()}”`}
          description="Periksa ejaan, atau coba nama plant dan nama owner yang lain."
          action={<Button onClick={resetAll}>Clear search</Button>}
        />
      );
    }
    const again = <Button onClick={checkAgain}>Check again</Button>;
    switch (query.status) {
      case "ONLINE":
        return <EmptyState illustration="empty-sites" title={<span className="text-warn-text">No sites are online right now</span>} description="Semua site sedang Alarm atau Offline. Periksa tab Alarm dan Offline." action={again} />;
      case "ALARM":
        return <EmptyState illustration="no-active-alarms" title="No active alarms" description="Tidak ada site dengan alarm aktif saat ini." action={again} />;
      case "OFFLINE":
        return <EmptyState illustration="all-sites-online" title="No offline sites" description="Semua site sedang terhubung." action={again} />;
      default:
        return <EmptyState illustration="empty-sites" title="No sites connected yet" description="Belum ada site yang terhubung ke akun ini." action={again} />;
    }
  })();

  return (
    <div className="pt-2">
      <Tabs items={tabs} value={query.status} onChange={(status) => update({ status })} aria-label="Filter status site" />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <SearchField
          value={searchDraft}
          onChange={setSearchDraft}
          onSubmit={applySearch}
          placeholder="Search plant name or owner"
          aria-label="Cari plant"
          wrapperClassName="w-[280px] max-w-full"
        />
        <Button variant="primary" onClick={applySearch} loading={searching} className="px-[17px]">
          {searching ? "Searching" : "Search"}
        </Button>
        <Button onClick={resetAll}>Reset</Button>
        <label htmlFor={checkboxId} className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-text">
          <Checkbox id={checkboxId} checked={expanded} onChange={(e) => setExpanded(e.target.checked)} />
          Show capacity and energy columns
        </label>
      </div>

      <div className="mt-[22px]" />
      <PlantTable
        rows={page.items}
        expanded={expanded}
        loading={isPending}
        searching={searching}
        sortBy={query.sortBy}
        order={query.order}
        onSort={toggleSort}
        onOpen={(id) => navigate(`/plants/${id}`)}
        message={message}
        footer={
          <Pagination
            page={page.page}
            pageSize={query.pageSize}
            totalItems={page.totalItems}
            onPageChange={(p) => update({ page: p })}
            onPageSizeChange={(pageSize) => update({ pageSize })}
            disabled={isPending || searching}
          />
        }
      />
    </div>
  );
}
