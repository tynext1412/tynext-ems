import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { Input, Select } from "./Input";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalItems: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 20, 50],
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const [goTo, setGoTo] = useState("");

  const jump = () => {
    const n = Number(goTo);
    if (Number.isInteger(n) && n >= 1 && n <= totalPages) onPageChange(n);
    setGoTo("");
  };

  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-3 text-sm text-muted", className)}>
      <span>
        Total <span className="font-mono text-text">{totalItems}</span>
      </span>

      <Select value={pageSize} onChange={(e) => onPageSizeChange(Number(e.target.value))} aria-label="Baris per halaman">
        {pageSizeOptions.map((size) => (
          <option key={size} value={size}>
            {size}/page
          </option>
        ))}
      </Select>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <PageButton disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Halaman sebelumnya">
          <ChevronLeft className="size-4" />
        </PageButton>
        {pageNumbers(page, totalPages).map((n, i) =>
          n === "…" ? (
            <span key={`gap-${i}`} className="px-1">
              …
            </span>
          ) : (
            <PageButton key={n} active={n === page} onClick={() => onPageChange(n)} aria-current={n === page ? "page" : undefined}>
              {n}
            </PageButton>
          ),
        )}
        <PageButton disabled={page >= totalPages} onClick={() => onPageChange(page + 1)} aria-label="Halaman berikutnya">
          <ChevronRight className="size-4" />
        </PageButton>
      </nav>

      <label className="flex items-center gap-2">
        Go to
        <Input
          className="w-16 text-center"
          inputMode="numeric"
          value={goTo}
          onChange={(e) => setGoTo(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && jump()}
          onBlur={() => goTo && jump()}
          aria-label="Lompat ke halaman"
        />
      </label>
    </div>
  );
}

function PageButton({
  active,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "grid h-10 min-w-10 place-items-center rounded-md border border-border px-2 font-mono text-xs transition-colors hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40",
        active && "border-accent text-accent",
        className,
      )}
      {...props}
    />
  );
}

// 1 … 4 5 [6] 7 8 … 20
function pageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}
