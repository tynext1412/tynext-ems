import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface PanelProps {
  title?: ReactNode;
  icon?: ReactNode; // ikon 24 px di kiri judul
  actions?: ReactNode;
  className?: string;
  bodyClassName?: string;
  // true = children sudah berupa Card (atau grid Card); false = dibungkus satu Card.
  cards?: boolean;
  // Jarak tepi panel ke kartu: 4 px di panel Home (Figma), 6 px di panel halaman site.
  inset?: 4 | 6;
  children: ReactNode;
  "aria-label"?: string;
}

// Panel abu-abu bersudut 20 px: judul di (12,16) dengan ikon 24 px, kartu putih mulai di y=52 (Figma).
export function Panel({ title, icon, actions, className, bodyClassName, cards, inset = 6, children, ...rest }: PanelProps) {
  return (
    <section className={cn("rounded-[20px] bg-surface-2", inset === 4 ? "p-1" : "p-1.5", className)} aria-label={rest["aria-label"]}>
      {(title || actions) && (
        <header className={cn("flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-2 pb-3", inset === 4 ? "px-2 pt-3" : "px-1.5 pt-2.5")}>
          {title && (
            <h2 className="flex items-center gap-1.5 text-sm font-medium leading-6 text-text">
              {icon && <span className="inline-flex size-6 shrink-0 items-center justify-center text-brand [&>svg]:size-5 [&>img]:size-6">{icon}</span>}
              {title}
            </h2>
          )}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </header>
      )}
      {cards ? <div className={cn("grid gap-1", bodyClassName)}>{children}</div> : <Card className={bodyClassName}>{children}</Card>}
    </section>
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl bg-surface p-4", className)}>{children}</div>;
}
