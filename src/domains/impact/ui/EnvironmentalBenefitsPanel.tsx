import co2Icon from "@/assets/figma/icons/icon-carbon-reduction.svg";
import coalIcon from "@/assets/figma/icons/icon-coal-savings.svg";
import leafIcon from "@/assets/figma/icons/icon-environmental-benefits.svg";
import treeIcon from "@/assets/figma/icons/icon-tree-equivalence.svg";
import { formatNumber } from "@/shared/domain/units";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Card, Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import type { EnvironmentalImpact } from "../domain/impact";

interface Props {
  impact?: EnvironmentalImpact;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  inset?: 4 | 6; // jarak tepi panel ke kartu (4 di Home, 6 di halaman site)
  className?: string;
}

// Tiga kartu: pohon setara, CO₂ yang dikurangi, batubara yang dihemat; ikon dari Figma.
export function EnvironmentalBenefitsPanel({ impact, loading, error, onRetry, inset, className }: Props) {
  return (
    <Panel icon={<img src={leafIcon} alt="" className="size-6" />} title="Environmental Benefits" cards inset={inset} className={cn(className)} aria-label="Environmental Benefits">
      {error ? (
        <Card className="flex items-center justify-between gap-3">
          <span className="text-sm text-danger-text">Couldn't load</span>
          <Button size="sm" variant="tertiary" onClick={onRetry}>
            Retry
          </Button>
        </Card>
      ) : (
        <>
          <Metric label="Equivalent trees" value={impact && formatNumber(impact.equivalentTrees, 0)} unit="trees" icon={treeIcon} iconClass="top-[9px] h-[60px] w-[60px]" loading={loading} />
          <Metric label="CO₂ reduction" value={impact && formatNumber(impact.co2ReductionTon, 2)} unit="t" icon={co2Icon} iconClass="top-[21px] h-12 w-[66px]" loading={loading} />
          <Metric label="Coal Saved" value={impact && formatNumber(impact.coalSavedTon, 2)} unit="t" icon={coalIcon} iconClass="top-[18px] h-[50px] w-[68px]" loading={loading} />
        </>
      )}
    </Panel>
  );
}

function Metric({ label, value, unit, icon, iconClass, loading }: { label: string; value?: string; unit: string; icon: string; iconClass: string; loading?: boolean }) {
  return (
    <Card className="relative h-[66px] overflow-hidden p-0">
      <div className="absolute left-3 top-[9px] w-[136px]">
        <div className="text-xs leading-5 text-muted">{label}</div>
        {loading || value === undefined ? (
          <Skeleton className="mt-1 h-5 w-24" />
        ) : (
          <div className="flex items-baseline gap-1.5 whitespace-nowrap">
            <span className="font-mono text-lg font-semibold leading-7 text-text">{value}</span>
            <span className="text-sm leading-6 text-muted">{unit}</span>
          </div>
        )}
      </div>
      <img src={icon} alt="" className={cn("absolute right-1", iconClass)} />
    </Card>
  );
}
