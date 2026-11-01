import { ArrowRight, CircleDollarSign, Pencil } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import dischargeIcon from "@/assets/figma/icons/icon-discharge.svg";
import { usePurchaseTariff } from "@/domains/performance/application/use-performances";
import { formatHour, TARIFF_MODE_LABEL, type PurchaseTariff } from "@/domains/performance/domain/tariff";
import type { PlantId } from "@/domains/plant/domain/plant";
import { formatNumber } from "@/shared/domain/units";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Chip } from "@/shared/ui/Chip";
import { Card, Panel } from "@/shared/ui/Panel";
import { Skeleton } from "@/shared/ui/Skeleton";
import { TariffBar, TariffSwatch } from "./TariffBar";
import { TariffEditDrawer } from "./TariffEditDrawer";

// Panel Tariff Management: tarif beli dari grid (flat 24 jam atau per periode jam) dan tombol Edit
// yang membuka drawer pengaturan. Perubahan langsung dipakai grafik SOC & Tariff di Overview.
export function TariffManagementPanel({ plantId }: { plantId: PlantId }) {
  const tariff = usePurchaseTariff(plantId);
  const [editing, setEditing] = useState(false);

  return (
    <Panel
      icon={<CircleDollarSign />}
      title="Tariff Management"
      actions={
        <Button size="sm" onClick={() => setEditing(true)} disabled={!tariff.data}>
          <Pencil className="size-4" aria-hidden />
          Edit
        </Button>
      }
      cards
    >
      {tariff.error ? (
        <Card>
          <Alert
            tone="danger"
            title="Tariff couldn't load"
            action={
              <Button size="sm" variant="tertiary" onClick={() => void tariff.refetch()}>
                Retry
              </Button>
            }
          >
            {tariff.error.message}
          </Alert>
        </Card>
      ) : (
        <PurchaseTariffCard tariff={tariff.data} loading={tariff.isPending} />
      )}
      {tariff.data && <TariffEditDrawer open={editing} onClose={() => setEditing(false)} plantId={plantId} tariff={tariff.data} />}
    </Panel>
  );
}

function PurchaseTariffCard({ tariff, loading }: { tariff?: PurchaseTariff; loading: boolean }) {
  const flat = tariff?.mode === "FLAT";
  const base = tariff?.baseRateIDRPerKWh ?? 0;

  return (
    <Card className="flex flex-col gap-4">
      <div className="grid gap-2.5">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <img src={dischargeIcon} alt="" className="size-5" />
          Purchase Tariff
          {tariff && (
            <Chip size="sm" variant="soft" tone="accent" className="ml-1">
              {TARIFF_MODE_LABEL[tariff.mode]}
            </Chip>
          )}
        </div>
        {loading || !tariff ? (
          <Skeleton className="h-8 w-40" />
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-2xl font-semibold leading-8 text-text">Rp {formatNumber(base, 2)}</span>
            <span className="text-sm text-muted">/ kWh</span>
          </div>
        )}
      </div>

      {tariff && (
        <>
          <p className="text-xs text-muted">{flat ? "Same rate for all 24 hours." : "Base rate. The periods below are charged at their own rate."}</p>
          <TariffBar tariff={tariff} />
          {!flat && (
            <ul className="grid gap-1.5 text-xs">
              {tariff.bands.map((b, i) => (
                <li key={`${b.startHour}-${b.endHour}`} className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <TariffSwatch segment={{ startHour: b.startHour, endHour: b.endHour, rateIDRPerKWh: b.rateIDRPerKWh, band: i }} base={base} />
                  <span className="w-24 font-mono text-text">
                    {formatHour(b.startHour)}–{formatHour(b.endHour)}
                  </span>
                  <span className="font-mono text-text">Rp {formatNumber(b.rateIDRPerKWh, 2)}</span>
                  <span className="text-muted">/ kWh · {formatNumber(b.rateIDRPerKWh / base, 2)}× base</span>
                </li>
              ))}
              <li className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <TariffSwatch segment={{ startHour: 0, endHour: 0, rateIDRPerKWh: base, band: null }} base={base} />
                <span className="w-24 text-text">Other hours</span>
                <span className="font-mono text-text">Rp {formatNumber(base, 2)}</span>
                <span className="text-muted">/ kWh · base</span>
              </li>
            </ul>
          )}
        </>
      )}

      <Link to=".." relative="path" className="mt-auto flex items-center justify-between gap-2 border-t border-separator pt-3 text-xs font-medium text-brand hover:underline">
        See Tariff Chart in Overview
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Card>
  );
}
