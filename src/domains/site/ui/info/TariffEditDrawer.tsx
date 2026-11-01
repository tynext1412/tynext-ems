import { Plus, Trash2 } from "lucide-react";
import { useId, useState } from "react";
import { useUpdatePurchaseTariff } from "@/domains/performance/application/use-performances";
import {
  bandHours,
  formatHour,
  hasTariffErrors,
  MAX_BANDS,
  parseRate,
  TARIFF_MODE_LABEL,
  validateTariff,
  type PurchaseTariff,
  type TariffErrors,
  type TariffMode,
} from "@/domains/performance/domain/tariff";
import type { PlantId } from "@/domains/plant/domain/plant";
import { formatNumber } from "@/shared/domain/units";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Drawer } from "@/shared/ui/Drawer";
import { Field, Input, Select } from "@/shared/ui/Input";
import { Tabs } from "@/shared/ui/Tabs";
import { TariffBar } from "./TariffBar";

interface Props {
  open: boolean;
  onClose: () => void;
  plantId: PlantId;
  tariff: PurchaseTariff;
}

const FORM_ID = "purchase-tariff-form";
const MODES: readonly TariffMode[] = ["FLAT", "TIME_OF_USE"];
const START_HOURS = Array.from({ length: 24 }, (_, h) => h);
const END_HOURS = Array.from({ length: 24 }, (_, h) => h + 1);

// Draft form menyimpan tarif sebagai teks supaya pengguna bebas mengetik "1.444,70".
interface BandDraft {
  key: string;
  startHour: number;
  endHour: number;
  rate: string;
}
interface Draft {
  mode: TariffMode;
  base: string;
  bands: BandDraft[];
}

const rateText = (rate: number) => formatNumber(rate, 2);

function toTariff(draft: Draft): PurchaseTariff {
  return {
    mode: draft.mode,
    baseRateIDRPerKWh: parseRate(draft.base),
    bands: draft.bands.map((b) => ({ startHour: b.startHour, endHour: b.endHour, rateIDRPerKWh: parseRate(b.rate) })),
  };
}

// Drawer "Edit Purchase Tariff": pilih Flat 24 hours (satu tarif) atau Time of use (tarif dasar +
// periode jam dengan tarif sendiri, boleh melewati tengah malam). Pratinjau bar 24 jam ikut berubah.
export function TariffEditDrawer({ open, onClose, plantId, tariff }: Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit Purchase Tariff"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form={FORM_ID} variant="primary">
            Save Changes
          </Button>
        </>
      }
    >
      {open && <TariffForm plantId={plantId} tariff={tariff} onSaved={onClose} />}
    </Drawer>
  );
}

function TariffForm({ plantId, tariff, onSaved }: { plantId: PlantId; tariff: PurchaseTariff; onSaved: () => void }) {
  const id = useId();
  const update = useUpdatePurchaseTariff(plantId);
  const [draft, setDraft] = useState<Draft>(() => ({
    mode: tariff.mode,
    base: rateText(tariff.baseRateIDRPerKWh),
    bands: tariff.bands.map((b, i) => ({ key: `saved-${i}`, startHour: b.startHour, endHour: b.endHour, rate: rateText(b.rateIDRPerKWh) })),
  }));
  const [errors, setErrors] = useState<TariffErrors>({});
  const [touched, setTouched] = useState(false);

  const change = (next: Draft) => {
    setDraft(next);
    if (touched) setErrors(validateTariff(toTariff(next)));
  };
  const setBand = (key: string, patch: Partial<BandDraft>) => change({ ...draft, bands: draft.bands.map((b) => (b.key === key ? { ...b, ...patch } : b)) });

  // Periode baru dimulai di jam pertama yang masih memakai tarif dasar, panjang 1 jam.
  const covered = new Set(draft.bands.flatMap((b) => bandHours({ startHour: b.startHour, endHour: b.endHour, rateIDRPerKWh: 0 })));
  const freeHour = START_HOURS.find((h) => !covered.has(h));
  const addBand = () => {
    if (freeHour === undefined) return;
    change({ ...draft, bands: [...draft.bands, { key: crypto.randomUUID(), startHour: freeHour, endHour: freeHour + 1, rate: draft.base }] });
  };

  const preview = toTariff(draft);
  const previewable = Number.isFinite(preview.baseRateIDRPerKWh) && preview.bands.every((b) => Number.isFinite(b.rateIDRPerKWh));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = toTariff(draft);
    const found = validateTariff(next);
    setErrors(found);
    setTouched(true);
    if (hasTariffErrors(found)) return;
    await update.mutateAsync(next);
    onSaved();
  };

  const tou = draft.mode === "TIME_OF_USE";

  return (
    <form id={FORM_ID} onSubmit={(e) => void submit(e)} className="grid gap-5" noValidate aria-busy={update.isPending}>
      <div className="grid gap-2">
        <span className="text-sm font-medium text-text">Tariff type</span>
        <Tabs
          variant="segmented"
          aria-label="Tariff type"
          items={MODES.map((m) => ({ value: m, label: TARIFF_MODE_LABEL[m] }))}
          value={draft.mode}
          onChange={(mode) => change({ ...draft, mode })}
          className="w-fit"
        />
      </div>

      <Field id={`${id}-base`} label={tou ? "Base rate (Rp/kWh)" : "Rate (Rp/kWh)"} required error={errors.base} hint={tou ? "Applies outside the periods" : "Applies to all 24 hours"}>
        <Input id={`${id}-base`} inputMode="decimal" value={draft.base} onChange={(e) => change({ ...draft, base: e.target.value })} aria-invalid={!!errors.base} placeholder="e.g. 1.444,70" required />
      </Field>

      {tou && (
        <fieldset className="grid gap-3">
          <legend className="mb-2 text-sm font-medium text-text">Periods</legend>
          {draft.bands.map((b, i) => {
            const error = errors.bands?.[i];
            return (
              <div key={b.key} className="grid gap-3 rounded-xl border border-border p-3" aria-invalid={!!error}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Period {i + 1}</span>
                  <Button iconOnly size="sm" variant="ghost" onClick={() => change({ ...draft, bands: draft.bands.filter((x) => x.key !== b.key) })} aria-label={`Remove period ${i + 1}`}>
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_1fr_1.4fr]">
                  <Field id={`${id}-start-${b.key}`} label="From">
                    <Select id={`${id}-start-${b.key}`} value={b.startHour} onChange={(e) => setBand(b.key, { startHour: Number(e.target.value) })} wrapperClassName="w-full">
                      {START_HOURS.map((h) => (
                        <option key={h} value={h}>
                          {formatHour(h)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field id={`${id}-end-${b.key}`} label="To">
                    <Select id={`${id}-end-${b.key}`} value={b.endHour} onChange={(e) => setBand(b.key, { endHour: Number(e.target.value) })} wrapperClassName="w-full">
                      {END_HOURS.map((h) => (
                        <option key={h} value={h}>
                          {formatHour(h)}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field id={`${id}-rate-${b.key}`} label="Rate (Rp/kWh)" className="col-span-2 sm:col-span-1">
                    <Input id={`${id}-rate-${b.key}`} inputMode="decimal" value={b.rate} onChange={(e) => setBand(b.key, { rate: e.target.value })} aria-invalid={!!error} />
                  </Field>
                </div>
                {b.endHour % 24 < b.startHour && b.endHour % 24 !== 0 && <p className="text-xs text-muted">Crosses midnight: {formatHour(b.startHour)} until {formatHour(b.endHour)} the next day.</p>}
                {error && (
                  <p className="text-xs text-danger-text" role="alert">
                    {error}
                  </p>
                )}
              </div>
            );
          })}
          <Button onClick={addBand} disabled={draft.bands.length >= MAX_BANDS || freeHour === undefined} className="w-fit">
            <Plus className="size-4" aria-hidden />
            Add period
          </Button>
        </fieldset>
      )}

      {errors.form && (
        <Alert tone="danger" title="Check the periods">
          {errors.form}
        </Alert>
      )}

      <div className="grid gap-2">
        <span className="text-sm font-medium text-text">Preview</span>
        {previewable ? <TariffBar tariff={preview} /> : <p className="text-xs text-muted">Enter valid rates to see the 24-hour preview.</p>}
      </div>

      {update.error && (
        <Alert tone="danger" title="Couldn't save">
          {update.error.message}
        </Alert>
      )}
    </form>
  );
}
