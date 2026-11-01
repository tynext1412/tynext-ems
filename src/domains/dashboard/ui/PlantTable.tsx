import { Eye } from "lucide-react";
import type { ReactNode } from "react";
import { inverterAvailability } from "@/domains/plant/domain/status-policy";
import { PlantStatusBadge } from "@/domains/plant/ui/PlantStatusBadge";
import { WeatherIcon } from "@/domains/plant/ui/WeatherIcon";
import { formatNumber } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { CopyButton } from "@/shared/ui/CopyButton";
import { DataTable, SkeletonRows, TableMessage, TBody, Td, Th, THead, Tr } from "@/shared/ui/DataTable";
import type { PlantRow, SortKey, SortOrder } from "../domain/plant-list";

interface Props {
  rows: PlantRow[];
  expanded: boolean; // kolom kapasitas & energi
  loading?: boolean; // load pertama: 10 baris skeleton
  searching?: boolean; // setelah klik Search: 5 baris skeleton
  sortBy: SortKey;
  order: SortOrder;
  onSort: (key: SortKey) => void;
  onOpen: (plantId: string) => void;
  footer?: ReactNode;
  message?: ReactNode; // empty state / galat, menggantikan baris
}

const BASE_COLUMNS = 8;
const EXTRA_COLUMNS = 8;

// Tabel Site List: kolom Action menempel di kanan, teks panjang dipotong satu baris dengan tooltip.
export function PlantTable({ rows, expanded, loading, searching, sortBy, order, onSort, onOpen, footer, message }: Props) {
  const sortProps = { sortBy, order, onSort };
  const columnCount = expanded ? BASE_COLUMNS + EXTRA_COLUMNS : BASE_COLUMNS;

  return (
    <DataTable stickyAction minWidth={expanded ? "2320px" : "1384px"} caption="Site list" footer={footer} busy={loading || searching}>
      <THead>
        <tr>
          <Th sortKey="status" width={129} {...sortProps}>Plant Status</Th>
          <Th sortKey="name" width={346} {...sortProps}>Plant Name</Th>
          <Th width={93}>Weather</Th>
          <Th width={213}>Owner</Th>
          <Th width={253}>Owner's Contact</Th>
          <Th width={153}>Inverter Online/Total</Th>
          <Th width={121}>Installer</Th>
          {expanded && (
            <>
              <Th align="right">PV (kWp)</Th>
              <Th align="right">Inverter (kW)</Th>
              <Th align="right">Battery (kWh)</Th>
              <Th align="right">Generation (kWh)</Th>
              <Th align="right">Charge (kWh)</Th>
              <Th align="right">Discharge (kWh)</Th>
              <Th align="right">Tariff (Rp/kWh)</Th>
              <Th align="right">Revenue (Rp)</Th>
            </>
          )}
          <Th width={76} className="text-center">Action</Th>
        </tr>
      </THead>
      <TBody>
        {loading && <SkeletonRows rows={10} cols={columnCount} />}
        {!loading && searching && <SkeletonRows rows={5} cols={columnCount} />}
        {!loading && !searching && message && <TableMessage cols={columnCount}>{message}</TableMessage>}
        {!loading &&
          !searching &&
          !message &&
          rows.map(({ plant, performance }) => {
            const inverter = inverterAvailability(plant.devices);
            return (
              <Tr key={plant.id} className="hover:bg-bg/60">
                <Td>
                  <PlantStatusBadge status={plant.status} />
                </Td>
                <Td>
                  <div className="max-w-[220px] truncate font-medium text-text" title={plant.name}>
                    {plant.name}
                  </div>
                  <div className="max-w-[220px] truncate text-xs text-muted" title={plant.location.address}>
                    {plant.location.address}
                  </div>
                </Td>
                <Td>
                  <WeatherIcon weather={plant.weather} />
                </Td>
                <Td>
                  <span className="block max-w-[200px] truncate" title={plant.owner.name}>
                    {plant.owner.name}
                  </span>
                </Td>
                <Td>
                  <span className="flex items-center gap-1">
                    <a href={`mailto:${plant.owner.contactEmail}`} className="max-w-[200px] truncate text-accent hover:underline" title={plant.owner.contactEmail}>
                      {plant.owner.contactEmail}
                    </a>
                    <CopyButton value={plant.owner.contactEmail} label="email" />
                  </span>
                </Td>
                <Td className={cn("font-mono", inverter.online < inverter.total && "text-warn-text")}>
                  {inverter.online}/{inverter.total}
                </Td>
                <Td>{plant.installer}</Td>
                {expanded && (
                  <>
                    <Td align="right" className="font-mono">{formatNumber(plant.capacity.pvKWp, 2)}</Td>
                    <Td align="right" className="font-mono">{formatNumber(plant.capacity.inverterKW, 2)}</Td>
                    <Td align="right" className="font-mono">{formatNumber(plant.capacity.batteryKWh, 2)}</Td>
                    <Td align="right" className="font-mono">{formatNumber(performance.generationKWh, 2)}</Td>
                    <Td align="right" className="font-mono">{formatNumber(performance.chargeKWh, 2)}</Td>
                    <Td align="right" className="font-mono">{formatNumber(performance.dischargeKWh, 2)}</Td>
                    <Td align="right" className="font-mono">{formatNumber(performance.tariffIDRPerKWh, 2)}</Td>
                    <Td align="right" className="font-mono">{formatNumber(performance.revenueIDR, 2)}</Td>
                  </>
                )}
                <Td align="center">
                  <Button iconOnly size="sm" variant="tertiary" onClick={() => onOpen(plant.id)} aria-label={`Open details for ${plant.name}`} title="View site details">
                    <Eye className="size-4" aria-hidden />
                  </Button>
                </Td>
              </Tr>
            );
          })}
      </TBody>
    </DataTable>
  );
}
