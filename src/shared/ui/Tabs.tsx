import { cn } from "@/shared/lib/cn";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

// Tab bergaris bawah tembaga (bukan pill) supaya radius tetap jadi penanda hierarki.
export function Tabs<T extends string>({ items, value, onChange, className }: TabsProps<T>) {
  return (
    <div role="tablist" className={cn("flex gap-1 overflow-x-auto border-b border-border [scrollbar-width:none]", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "-mb-px flex h-11 shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-sm transition-colors",
              active ? "border-accent font-semibold text-text" : "border-transparent text-muted hover:text-text",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn("font-mono text-xs", active ? "text-accent" : "text-muted")}>{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
