import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { CountBadge } from "./Chip";

export interface TabItem<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode; // ikon kecil di kiri label (mis. pengalih tampilan List / Calendar)
  count?: number;
  disabled?: boolean;
}

interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  // underline: tab halaman (garis bawah biru); segmented: pilihan dalam satu pill abu-abu.
  variant?: "underline" | "segmented";
  size?: "sm" | "md";
  // Bayangan item terpilih pada varian segmented: "tab" (Tabs HeroUI) atau "toggle" (SegmentedControl).
  activeShadow?: "tab" | "toggle";
  className?: string;
  "aria-label"?: string;
}

export function Tabs<T extends string>({ items, value, onChange, variant = "underline", size = "md", activeShadow = "tab", className, ...rest }: TabsProps<T>) {
  if (variant === "segmented") {
    return (
      <div
        role="tablist"
        aria-label={rest["aria-label"]}
        className={cn(
          "inline-flex max-w-full shrink-0 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]",
          // Figma: Tabs 36 px (pad 4/8, radius 12, #ebebec); SegmentedControl 36 px (pad 2, radius 10, #f1f1f1).
          activeShadow === "toggle" ? "rounded-[10px] bg-[#f1f1f1] p-0.5" : "rounded-xl bg-surface-3 px-2 py-1",
          className,
        )}
      >
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              role="tab"
              type="button"
              aria-selected={active}
              disabled={item.disabled}
              onClick={() => onChange(item.value)}
              className={cn(
                "flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors disabled:opacity-50",
                activeShadow === "toggle" ? "h-8 min-w-[42px] rounded-lg px-3 text-sm" : size === "sm" ? "h-7 rounded-lg px-2.5 text-xs" : "h-7 rounded-[10px] px-3 text-sm",
                active ? cn("bg-surface text-text", activeShadow === "toggle" ? "shadow-toggle" : "shadow-tab") : "text-muted hover:text-text",
              )}
            >
              {item.icon && <span className="inline-flex shrink-0 [&>svg]:size-4" aria-hidden>{item.icon}</span>}
              {item.label}
              {item.count !== undefined && <span className={cn("font-mono text-xs", active ? "text-muted" : "text-muted/80")}>{item.count}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="tablist" aria-label={rest["aria-label"]} className={cn("flex gap-1 overflow-x-auto border-b border-separator [scrollbar-width:none]", className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={item.disabled}
            onClick={() => onChange(item.value)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 font-medium transition-colors disabled:opacity-50",
              size === "sm" ? "h-8 px-3 text-xs" : "h-[34px] px-4 text-sm",
              active ? "border-brand text-text" : "border-transparent text-muted hover:text-text",
            )}
          >
            {item.icon && <span className="inline-flex shrink-0 [&>svg]:size-4" aria-hidden>{item.icon}</span>}
            {item.label}
            {item.count !== undefined && <CountBadge value={item.count} />}
          </button>
        );
      })}
    </div>
  );
}
