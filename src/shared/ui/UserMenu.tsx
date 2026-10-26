import { cn } from "@/shared/lib/cn";

// Identity & Access belum ada. Ditampilkan sebagai label status, bukan tombol,
// supaya tidak ada kontrol yang tidak berfungsi.
export function UserMenu({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-xs text-muted", className)}
      aria-label="Status akun"
    >
      <span className="size-2 rounded-full bg-border" aria-hidden />
      Login belum tersedia
    </div>
  );
}
