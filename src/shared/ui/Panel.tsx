import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface PanelProps {
  title?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Panel({ title, actions, className, children }: PanelProps) {
  return (
    <section className={cn("panel-metal rounded-lg p-5", className)}>
      {(title || actions) && (
        <header className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {actions}
        </header>
      )}
      {children}
    </section>
  );
}
