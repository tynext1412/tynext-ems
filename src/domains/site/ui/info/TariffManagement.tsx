import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import chargeIcon from "@/assets/figma/icons/icon-charge.svg";
import dischargeIcon from "@/assets/figma/icons/icon-discharge.svg";
import type { PlantPerformance } from "@/domains/performance/domain/performance";
import { formatNumber } from "@/shared/domain/units";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";

interface Props {
  performance?: PlantPerformance;
  loading: boolean;
  error?: Error | null;
  onRetry: () => void;
}

// Jam puncak (WBP) PLN: 17:00–22:00, dikalikan faktor K 1,4 terhadap tarif LWBP (lihat mock performa).
const PEAK_START_HOUR = 17;
const PEAK_END_HOUR = 22;
const PEAK_FACTOR_LABEL = "1,4×";

// Dua kartu tarif: beli dari grid (dengan bar jam puncak) dan jual (feed-in, dasar revenue).
export function TariffManagement({ performance, loading, error, onRetry }: Props) {
  if (error) {
    return (
      <Card>
        <Alert
          tone="danger"
          title="Tarif tidak bisa dimuat"
          action={
            <Button size="sm" variant="tertiary" onClick={onRetry}>
              Retry
            </Button>
          }
        >
          {error.message}
        </Alert>
      </Card>
    );
  }

  return (
    <div className="grid gap-1.5 md:grid-cols-2">
      <Card className="flex flex-col gap-4">
        <TariffValue icon={dischargeIcon} label="Purchase Tariff" value={performance?.purchaseTariffIDRPerKWh} loading={loading} />
        <p className="text-xs text-muted">
          Off-peak rate (LWBP). Peak hours (WBP) are charged at {PEAK_FACTOR_LABEL}
        </p>
        <PeakHoursBar />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-accent/15" aria-hidden />
            Off-peak (LWBP)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm bg-accent" aria-hidden />
            Peak (WBP) {PEAK_FACTOR_LABEL}
          </span>
        </div>
        <Link to=".." relative="path" className="mt-auto flex items-center justify-between gap-2 border-t border-separator pt-3 text-xs font-medium text-brand hover:underline">
          See Tariff Chart in Overview
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </Card>

      <Card className="flex flex-col gap-4">
        <TariffValue icon={chargeIcon} label="Feed-in Tariff" value={performance?.tariffIDRPerKWh} loading={loading} />
        <p className="text-xs text-muted">Used as the basis for revenue calculation</p>
      </Card>
    </div>
  );
}

function TariffValue({ icon, label, value, loading }: { icon: string; label: string; value?: number; loading: boolean }) {
  return (
    <div className="grid gap-2.5">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <img src={icon} alt="" className="size-5" />
        {label}
      </div>
      {loading ? (
        <Skeleton className="h-8 w-40" />
      ) : value === undefined ? (
        <div className="text-sm text-muted">belum ditetapkan</div>
      ) : (
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-2xl font-semibold leading-8 text-text">Rp {formatNumber(value, 2)}</span>
          <span className="text-sm text-muted">/ kWh</span>
        </div>
      )}
    </div>
  );
}

// Bar 24 jam: segmen biru = jam puncak; label jam di bawahnya.
function PeakHoursBar() {
  const left = (PEAK_START_HOUR / 24) * 100;
  const width = ((PEAK_END_HOUR - PEAK_START_HOUR) / 24) * 100;
  const ticks = [
    { hour: 0, label: "00:00", align: "left" },
    { hour: PEAK_START_HOUR, label: "17:00", align: "center" },
    { hour: PEAK_END_HOUR, label: "22:00", align: "center" },
  ] as const;

  return (
    <div role="img" aria-label={`Jam puncak ${ticks[1].label} sampai ${ticks[2].label}`}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-accent/15">
        <span className="absolute inset-y-0 rounded-full bg-accent" style={{ left: `${left}%`, width: `${width}%` }} />
      </div>
      <div className="relative mt-1 h-5 text-xs text-muted">
        {ticks.map((t) => (
          <span key={t.hour} className="absolute top-0" style={{ left: `${(t.hour / 24) * 100}%`, transform: t.align === "center" ? "translateX(-50%)" : undefined }}>
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
