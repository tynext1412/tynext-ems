import { Chip } from "@/shared/ui/Chip";
import { cn } from "@/shared/lib/cn";

// Penanda inverter master; nama perangkat tidak memuat kata "Master".
export function MasterChip({ className }: { className?: string }) {
  return (
    <Chip tone="accent" variant="soft" size="sm" className={cn("bg-accent/15 text-accent", className)}>
      Master
    </Chip>
  );
}
