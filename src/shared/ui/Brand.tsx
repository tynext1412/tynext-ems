import { cn } from "@/shared/lib/cn";

// Wordmark teks: logo resmi Tynext belum diberikan, jadi tidak dibuat-buat.
export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-baseline gap-2 leading-none", className)}>
      <span className="text-lg font-semibold tracking-[0.08em]">TYNEXT</span>
      <span className="text-xs text-copper">EMS</span>
    </div>
  );
}
