import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/Skeleton";

// Potongan UI yang dipakai ketiga halaman detail perangkat.

export function InfoGrid({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm @xl:grid-cols-3 @4xl:grid-cols-4">{children}</dl>;
}

export function Field({ label, children, mono }: { label: string; children: ReactNode; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className={cn("mt-0.5 break-words", mono && "font-mono")}>{children}</dd>
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
        <Skeleton className="mt-1 h-5 w-20" />
      ) : (
        <div className={cn("mt-0.5 font-mono text-base font-semibold", tone)}>
          {value}
          {unit && <span className="ml-1 text-xs font-medium text-muted">{unit}</span>}
        </div>
      )}
    </div>
  );
}

export function MeasureTable({ caption, columns, rows, loading }: { caption: string; columns: string[]; rows: (string | number)[][]; loading?: boolean }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-bg text-xs text-muted">
          <tr>
            {columns.map((c, i) => (
              <th key={c} className={cn("px-3 py-2 font-medium", i === 0 ? "text-left" : "text-right")}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-3">
                <Skeleton className="h-5 w-full" />
              </td>
            </tr>
          )}
          {!loading &&
            rows.map((r, i) => (
              <tr key={i}>
                {r.map((cell, j) => (
                  <td key={j} className={cn("px-3 py-2", j === 0 ? "text-left" : "text-right font-mono")}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
