import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { Select } from "./Input";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  disabled?: boolean; // saat memuat: tampil redup
  itemLabel?: string; // "results"
  className?: string;
}

// "Showing [1-10] of 120 results … ‹ Previous 1 2 3 … 12 Next ›" seperti di desain.
export function Pagination({ page, pageSize, totalItems, pageSizeOptions = [10, 20, 50], onPageChange, onPageSizeChange, disabled, itemLabel = "results", className }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <div className={cn("flex w-full flex-wrap items-center justify-between gap-3 text-sm text-muted", disabled && "pointer-events-none opacity-50", className)} aria-disabled={disabled || undefined}>
      <div className="flex items-center gap-2">
        <span>Showing</span>
        <Select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} aria-label="Rows per page" className="h-9 w-24 text-text">
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              1-{size}
            </option>
          ))}
        </Select>
        <span>
          of <span className="font-mono">{totalItems}</span> {itemLabel}
        </span>
      </div>

      <nav className="flex items-center gap-2" aria-label="Pagination">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)} className="inline-flex h-8 items-center gap-1 rounded-full px-3 hover:text-text disabled:cursor-not-allowed disabled:opacity-40">
          <ChevronLeft className="size-4" aria-hidden />
          Previous
        </button>
        {pageNumbers(page, totalPages).map((n, i) =>
          n === "…" ? (
            <span key={`gap-${i}`} className="px-1" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              onClick={() => onPageChange(n)}
              aria-current={n === page ? "page" : undefined}
              className={cn("inline-grid size-8 place-items-center rounded-full font-mono text-sm transition-colors hover:text-text", n === page ? "bg-surface-3 font-medium text-text" : undefined)}
            >
              {n}
            </button>
          ),
        )}
        <button type="button" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} className="inline-flex h-8 items-center gap-1 rounded-full px-3 hover:text-text disabled:cursor-not-allowed disabled:opacity-40">
          Next
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </nav>
    </div>
  );
}

// 1 2 3 … 10 11 12
function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, 3, total - 2, total - 1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}
