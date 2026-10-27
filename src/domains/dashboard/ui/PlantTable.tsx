import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { inverterAvailability } from "@/domains/plant/domain/status-policy";
import { PlantStatusBadge } from "@/domains/plant/ui/PlantStatusBadge";
import { WeatherIcon } from "@/domains/plant/ui/WeatherIcon";
import { formatIDR, formatNumber } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { PlantRow, SortKey, SortOrder } from "../domain/plant-list";

interface Props {
  rows: PlantRow[];
  expanded: boolean;
  loading?: boolean;
  sortBy: SortKey;
  order: SortOrder;
  onSort: (key: SortKey) => void;
  onOperation: (plantId: string) => void;
  onClearFilters: () => void;
}

const SKELETON_ROWS = 5;

export function PlantTable({ rows, expanded, loading, sortBy, order, onSort, onOperation, onClearFilters }: Props) {
  const sortProps = { sortBy, order, onSort };
  const columnCount = expanded ? 16 : 8;

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-240 text-left text-sm">
        <thead className="bg-bg text-xs text-muted">
          <tr>
            <Th sortKey="status" {...sortProps}>Plant Status</Th>
            <Th sortKey="name" {...sortProps}>Plant Name</Th>
            <Th>Weather</Th>
            <Th>Owner</Th>
            <Th>Owner's Contact</Th>
            <Th className="text-center">Inverter Online/Total</Th>
            <Th>Installer</Th>
            {expanded && (
              <>
                <Th sortKey="pvCapacity" {...sortProps} className="text-right">PV (kWp)</Th>
                <Th className="text-right">Inverter (kW)</Th>
                <Th className="text-right">Battery (kWh)</Th>
                <Th sortKey="generation" {...sortProps} className="text-right">Generation (kWh)</Th>
                <Th className="text-right">Charge (kWh)</Th>
                <Th className="text-right">Discharge (kWh)</Th>
                <Th className="text-right">Tariff (Rp/kWh)</Th>
                <Th sortKey="revenue" {...sortProps} className="text-right">Revenue (Rp)</Th>
              </>
            )}
            <Th>Operation</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading && (
            <>
              <tr className="sr-only">
                <td colSpan={columnCount}>Memuat daftar site…</td>
              </tr>
              {Array.from({ length: SKELETON_ROWS }, (_, i) => (
                <tr key={i} aria-hidden>
                  <td colSpan={columnCount} className="px-3 py-3">
                    <Skeleton className="h-5 w-full" />
                  </td>
                </tr>
              ))}
            </>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan={columnCount} className="px-3 py-10 text-center text-muted">
                Tidak ada plant yang cocok dengan pencarian atau tab status ini.{" "}
                <button type="button" onClick={onClearFilters} className="text-accent underline-offset-2 hover:underline">
                  Tampilkan semua plant
                </button>
              </td>
            </tr>
          )}

          {!loading &&
            rows.map(({ plant, performance }) => {
              const inverter = inverterAvailability(plant.devices);
              const inverterTone = inverter.online === inverter.total ? "text-ok" : "text-warn";

              return (
                <tr key={plant.id} className="hover:bg-surface-2/70">
                  <Td><PlantStatusBadge status={plant.status} /></Td>
                  <Td>
                    <div className="font-medium">{plant.name}</div>
                    <div className="text-xs text-muted">{plant.location.address}</div>
                  </Td>
                  <Td><WeatherIcon weather={plant.weather} /></Td>
                  <Td>{plant.owner.name}</Td>
                  <Td>
                    <a href={`mailto:${plant.owner.contactEmail}`} className="text-accent underline-offset-2 hover:underline">
                      {plant.owner.contactEmail}
                    </a>
                  </Td>
                  <Td className={cn("text-center font-mono", inverterTone)}>
                    {inverter.online}/{inverter.total}
                  </Td>
                  <Td>{plant.installer}</Td>
                  {expanded && (
                    <>
                      <Td mono>{formatNumber(plant.capacity.pvKWp)}</Td>
                      <Td mono>{formatNumber(plant.capacity.inverterKW)}</Td>
                      <Td mono>{formatNumber(plant.capacity.batteryKWh)}</Td>
                      <Td mono>{formatNumber(performance.generationKWh)}</Td>
                      <Td mono>{formatNumber(performance.chargeKWh)}</Td>
                      <Td mono>{formatNumber(performance.dischargeKWh)}</Td>
                      <Td mono>{formatNumber(performance.tariffIDRPerKWh)}</Td>
                      <Td mono>{formatIDR(performance.revenueIDR)}</Td>
                    </>
                  )}
                  <Td>
                    <Button onClick={() => onOperation(plant.id)} className="h-9">
                      Operation
                    </Button>
                  </Td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  children,
  className,
  sortKey,
  sortBy,
  order,
  onSort,
}: {
  children: ReactNode;
  className?: string;
  sortKey?: SortKey;
  sortBy?: SortKey;
  order?: SortOrder;
  onSort?: (key: SortKey) => void;
}) {
  if (!sortKey || !onSort) {
    return <th className={cn("whitespace-nowrap px-3 py-2.5 font-medium", className)}>{children}</th>;
  }

  const active = sortBy === sortKey;
  const Icon = !active ? ArrowUpDown : order === "asc" ? ArrowUp : ArrowDown;

  return (
    <th className={cn("whitespace-nowrap px-3 py-2.5 font-medium", className)} aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(sortKey)} className={cn("inline-flex h-8 items-center gap-1 hover:text-text", active && "text-accent")}>
        {children}
        <Icon className="size-3.5" aria-hidden />
      </button>
    </th>
  );
}

function Td({ children, className, mono }: { children: ReactNode; className?: string; mono?: boolean }) {
  return <td className={cn("whitespace-nowrap px-3 py-2.5 align-middle", mono && "text-right font-mono", className)}>{children}</td>;
}
