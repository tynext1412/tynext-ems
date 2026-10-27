import { cn } from "@/shared/lib/cn";

// Penanda inverter master; nama perangkat tidak memuat kata "Master".
export function MasterChip({ className }: { className?: string }) {
  return <span className={cn("shrink-0 rounded-sm bg-accent/15 px-1.5 py-0.5 text-[11px] font-medium leading-none text-accent", className)}>Master</span>;
}
