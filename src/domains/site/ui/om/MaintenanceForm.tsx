import { useId, useState } from "react";
import { useCreateMaintenance } from "@/domains/maintenance/application/use-maintenance";
import { ACTIVITY_MAX_LENGTH, MAINTENANCE_TYPE_LABEL, MAINTENANCE_TYPES, validateDraft, type MaintenanceActivity, type MaintenanceDraft, type MaintenanceDraftErrors } from "@/domains/maintenance/domain/maintenance";
import type { Plant } from "@/domains/plant/domain/plant";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Input, Select, Textarea } from "@/shared/ui/Input";

interface Props {
  plant: Plant;
  today: string;
  onCreated: (activity: MaintenanceActivity) => void;
  onCancel: () => void;
}

// Form tambah aktivitas O&M. Status tidak dipilih di sini: Upcoming/Pending mengikuti tanggal,
// Done ditandai dari panel detail setelah pekerjaan selesai.
export function MaintenanceForm({ plant, today, onCreated, onCancel }: Props) {
  const create = useCreateMaintenance(plant.id);
  const id = useId();
  const [draft, setDraft] = useState<MaintenanceDraft>({ date: today, type: "REGULAR", activity: "", notes: "" });
  const [errors, setErrors] = useState<MaintenanceDraftErrors>({});
  const [touched, setTouched] = useState(false);

  const set = <K extends keyof MaintenanceDraft>(key: K, value: MaintenanceDraft[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (touched) setErrors(validateDraft(next));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateDraft(draft);
    setErrors(found);
    setTouched(true);
    if (Object.keys(found).length > 0) return;
    const created = await create.mutateAsync(draft);
    onCreated(created);
  };

  return (
    <form onSubmit={(e) => void submit(e)} className="grid gap-4" noValidate>
      <Field id={`${id}-date`} label="Date" error={errors.date}>
        <Input id={`${id}-date`} type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} aria-invalid={!!errors.date} className="w-full" required />
      </Field>
      <Field id={`${id}-type`} label="Type" error={errors.type}>
        <Select id={`${id}-type`} value={draft.type} onChange={(e) => set("type", e.target.value as MaintenanceDraft["type"])} className="w-full">
          {MAINTENANCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {MAINTENANCE_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
      </Field>
      <Field id={`${id}-activity`} label="O&M Activities" error={errors.activity} hint={`${draft.activity.trim().length}/${ACTIVITY_MAX_LENGTH}`}>
        <Input
          id={`${id}-activity`}
          value={draft.activity}
          onChange={(e) => set("activity", e.target.value)}
          placeholder="mis. Pembersihan modul PV blok A"
          aria-invalid={!!errors.activity}
          className="w-full"
          required
        />
      </Field>
      <Field id={`${id}-notes`} label="Notes (opsional)" error={errors.notes}>
        <Textarea id={`${id}-notes`} value={draft.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Catatan persiapan, alat, atau teknisi" className="w-full" />
      </Field>

      {create.error && (
        <p role="alert" className="text-sm text-danger">
          Gagal menyimpan: {create.error.message}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onCancel} disabled={create.isPending}>
          Batal
        </Button>
        <Button type="submit" variant="primary" disabled={create.isPending}>
          {create.isPending ? "Menyimpan…" : "Simpan aktivitas"}
        </Button>
      </div>
    </form>
  );
}

function Field({ id, label, error, hint, children }: { id: string; label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs text-muted">
          {label}
        </label>
        {hint && <span className="font-mono text-[11px] text-muted">{hint}</span>}
      </div>
      {children}
      <p id={`${id}-error`} className={cn("min-h-4 text-xs text-danger", !error && "sr-only")} aria-live="polite">
        {error}
      </p>
    </div>
  );
}
