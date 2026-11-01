import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode, type TdHTMLAttributes, type ThHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";
import { Skeleton } from "./Skeleton";

interface DataTableProps {
  children: ReactNode; // <thead> dan <tbody>
  footer?: ReactNode; // baris pagination di dalam bingkai abu-abu
  stickyAction?: boolean; // kolom terakhir menempel di kanan saat tabel di-scroll
  minWidth?: string; // mis. "960px"
  caption?: string;
  className?: string;
  busy?: boolean;
}

// Bingkai tabel: sudut 16 px, header dan footer abu-abu, baris putih 60 px dengan garis pemisah.
export function DataTable({ children, footer, stickyAction, minWidth, caption, className, busy }: DataTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [overflowing, setOverflowing] = useState(false);

  const measure = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setOverflowing(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure, children]);

  return (
    <div className={cn("overflow-hidden rounded-2xl bg-surface-2 p-1", className)}>
      <div ref={scrollRef} onScroll={measure} className="overflow-x-auto rounded-xl">
        <table className={cn("w-full text-left text-sm", stickyAction && "table-sticky-action", stickyAction && overflowing && "is-overflowing")} style={minWidth ? { minWidth } : undefined} aria-busy={busy || undefined}>
          {caption && <caption className="sr-only">{caption}</caption>}
          {children}
        </table>
      </div>
      {footer && <div className="flex min-h-14 items-center py-2.5 pl-4 pr-2">{footer}</div>}
    </div>
  );
}

// Header 40 px abu-abu; tiap kolom (kecuali pertama) diawali garis pemisah tipis 16 px seperti di Figma.
export function THead({ children }: { children: ReactNode }) {
  return <thead className="text-xs text-muted [&>tr]:bg-surface-2 [&>tr>th+th]:relative [&>tr>th+th]:before:absolute [&>tr>th+th]:before:left-0 [&>tr>th+th]:before:top-3 [&>tr>th+th]:before:h-4 [&>tr>th+th]:before:w-px [&>tr>th+th]:before:bg-border">{children}</thead>;
}

// Badan tabel putih bersudut 12 px di dalam bingkai abu-abu.
export function TBody({ children }: { children: ReactNode }) {
  return (
    <tbody className="bg-surface [&>tr:first-child>td:first-child]:rounded-tl-xl [&>tr:first-child>td:last-child]:rounded-tr-xl [&>tr:last-child>td:first-child]:rounded-bl-xl [&>tr:last-child>td:last-child]:rounded-br-xl">
      {children}
    </tbody>
  );
}

export function Tr({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={cn("border-b border-separator-3 bg-surface last:border-b-0", className)} {...props}>
      {children}
    </tr>
  );
}

interface ThProps<K extends string> extends ThHTMLAttributes<HTMLTableCellElement> {
  sortKey?: K;
  sortBy?: K;
  order?: "asc" | "desc";
  onSort?: (key: K) => void;
  align?: "left" | "right" | "center";
  width?: number; // lebar kolom tetap (px) seperti di desain
}

const ALIGN = { left: "text-left", right: "text-right", center: "text-center" } as const;

export function Th<K extends string>({ children, className, sortKey, sortBy, order, onSort, align = "left", width, style, ...props }: ThProps<K>) {
  const base = cn("h-10 whitespace-nowrap px-4 font-medium", ALIGN[align], className);
  const widthStyle = width ? { width, minWidth: width, ...style } : style;
  if (!sortKey || !onSort) {
    return (
      <th className={base} style={widthStyle} {...props}>
        {children}
      </th>
    );
  }
  const active = sortBy === sortKey;
  const Icon = !active ? ArrowUpDown : order === "asc" ? ArrowUp : ArrowDown;
  return (
    <th className={base} style={widthStyle} aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"} {...props}>
      <button type="button" onClick={() => onSort(sortKey)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-md hover:text-text", active && "text-text")}>
        {children}
        <Icon className="size-3.5" aria-hidden />
      </button>
    </th>
  );
}

export function Td({ children, className, align = "left", ...props }: TdHTMLAttributes<HTMLTableCellElement> & { align?: "left" | "right" | "center" }) {
  return (
    <td className={cn("h-[60px] whitespace-nowrap px-4 align-middle", ALIGN[align], className)} {...props}>
      {children}
    </td>
  );
}

// Baris skeleton saat memuat (PRD: 10 baris saat load pertama, 5 saat pencarian).
export function SkeletonRows({ rows, cols }: { rows: number; cols: number }) {
  return (
    <>
      <tr className="sr-only">
        <td colSpan={cols}>Memuat data…</td>
      </tr>
      {Array.from({ length: rows }, (_, i) => (
        <Tr key={i} aria-hidden>
          {Array.from({ length: cols }, (_, j) => (
            <Td key={j}>
              <Skeleton className={cn("h-4", j === 0 ? "w-16" : j === 1 ? "w-40" : "w-24")} />
            </Td>
          ))}
        </Tr>
      ))}
    </>
  );
}

// Satu sel lebar untuk empty state / galat di dalam tabel.
export function TableMessage({ cols, children, className }: { cols: number; children: ReactNode; className?: string }) {
  return (
    <Tr>
      <td colSpan={cols} className={cn("bg-surface p-0", className)}>
        {children}
      </td>
    </Tr>
  );
}
