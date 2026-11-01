import type { ReactNode } from "react";
import allSitesOnline from "@/assets/figma/illustrations/illustration-all-sites-online.svg";
import emptySites from "@/assets/figma/illustrations/illustration-empty-sites.svg";
import maintenance from "@/assets/figma/illustrations/illustration-maintenance.svg";
import mapError from "@/assets/figma/illustrations/illustration-map-error.svg";
import noAccess from "@/assets/figma/illustrations/illustration-no-access.svg";
import noActiveAlarms from "@/assets/figma/illustrations/illustration-no-active-alarms.svg";
import noSearchResults from "@/assets/figma/illustrations/illustration-no-search-results.svg";
import notFound from "@/assets/figma/illustrations/illustration-not-found.svg";
import serverError from "@/assets/figma/illustrations/illustration-server-error.svg";
import sessionExpired from "@/assets/figma/illustrations/illustration-session-expired.svg";
import signOut from "@/assets/figma/illustrations/illustration-sign-out.svg";
import { cn } from "@/shared/lib/cn";

// Ilustrasi state dari set "Illustrations (components)" di Figma.
export const ILLUSTRATION = {
  "all-sites-online": allSitesOnline,
  "empty-sites": emptySites,
  maintenance,
  "map-error": mapError,
  "no-access": noAccess,
  "no-active-alarms": noActiveAlarms,
  "no-search-results": noSearchResults,
  "not-found": notFound,
  "server-error": serverError,
  "session-expired": sessionExpired,
  "sign-out": signOut,
} as const;

export type IllustrationName = keyof typeof ILLUSTRATION;

interface EmptyStateProps {
  illustration: IllustrationName;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const IMG_SIZE = { sm: "h-24", md: "h-36", lg: "h-44" } as const;

export function EmptyState({ illustration, title, description, action, size = "md", className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}>
      <img src={ILLUSTRATION[illustration]} alt="" className={cn("w-auto", IMG_SIZE[size])} />
      <h3 className={cn("mt-5 font-semibold text-text", size === "lg" ? "text-lg" : "text-base")}>{title}</h3>
      {description && <p className="mt-1.5 max-w-md text-sm text-muted">{description}</p>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
