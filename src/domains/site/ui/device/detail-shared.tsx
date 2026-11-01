import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { DataTable, TBody, Td, Th, THead, Tr } from "@/shared/ui/DataTable";
import { Skeleton } from "@/shared/ui/Skeleton";

// Potongan UI yang dipakai keempat halaman detail perangkat.

export function InfoGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm @xl:grid-cols-3 @4xl:grid-cols-4">{children}</dl>;
}

export function Field({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={cn("mt-0.5 break-words font-medium text-text", mono && "font-mono")}>{children}</dd>
    </div>
  );
}

export function PlantLink({ plantId, name }: { plantId: string; name: string }) {
  return (
    <Link to={`/plants/${plantId}`} className="text-accent underline-offset-2 hover:underline">
      {name}
    </Link>
  );
}

export function Stat({ label, value, unit, loading, tone }: { label: string; value?: string; unit?: string; loading?: boolean; tone?: string }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      {loading || value === undefined ? (
        <Skeleton className="mt-1 h-6 w-20" />
      ) : (
        <div className={cn("mt-0.5 font-mono text-lg font-semibold leading-7", tone)}>
          {value}
          {unit && <span className="ml-1 text-sm font-normal text-muted">{unit}</span>}
        </div>
      )}
    </div>
  );
}

// Tabel pengukuran ringkas (string DC, fasa AC, energi per periode): baris 40 px, angka rata kanan.
export function MeasureTable({ caption, columns, rows, loading }: { caption: string; columns: string[]; rows: (string | number)[][]; loading?: boolean }) {
  return (
    <DataTable caption={caption}>
      <THead>
        <tr>
          {columns.map((c, i) => (
            <Th key={`${c}-${i}`} align={i === 0 ? "left" : "right"} className="h-9">
              {c}
            </Th>
          ))}
        </tr>
      </THead>
      <TBody>
        {loading && (
          <Tr>
            <Td colSpan={columns.length} className="h-10">
              <Skeleton className="h-4 w-full" />
            </Td>
          </Tr>
        )}
        {!loading && rows.length === 0 && (
          <Tr>
            <Td colSpan={columns.length} className="h-10 text-center text-muted">
              –
            </Td>
          </Tr>
        )}
        {!loading &&
          rows.map((r, i) => (
            <Tr key={i}>
              {r.map((cell, j) => (
                <Td key={j} align={j === 0 ? "left" : "right"} className={cn("h-10", j > 0 && "font-mono")}>
                  {cell}
                </Td>
              ))}
            </Tr>
          ))}
      </TBody>
    </DataTable>
  );
}
