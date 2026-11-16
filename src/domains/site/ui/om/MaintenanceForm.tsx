import { useId, useState } from "react";
import { useCreateMaintenance, useUpdateMaintenance } from "@/domains/maintenance/application/use-maintenance";
import {
  ACTIVITY_MAX_LENGTH,
  MAINTENANCE_TYPE_LABEL,
  MAINTENANCE_TYPES,
  NOTES_MAX_LENGTH,
  validateDraft,
  type MaintenanceActivity,
  type MaintenanceDraft,
  type MaintenanceDraftErrors,
} from "@/domains/maintenance/domain/maintenance";
import type { Plant } from "@/domains/plant/domain/plant";
import { fieldErrors } from "@/shared/lib/apiClient";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Drawer } from "@/shared/ui/Drawer";
import { Field, Input, Select, Textarea } from "@/shared/ui/Input";

interface Props {
  open: boolean;
  onClose: () => void;
  plant: Plant;
  today: string;
  // Tanpa activity = form tambah; dengan activity = form edit (jadwal, tipe, aktivitas, catatan).
  activity?: MaintenanceActivity;
  initialDate?: string; // tanggal awal form tambah (mis. dari tombol "+" di kalender); bawaan hari ini
  onSaved: (activity: MaintenanceActivity) => void;
}

// Drawer "Add O&M Activity" / "Edit Activity". Status tidak dipilih di sini: Upcoming/Pending mengikuti
// tanggal, Done ditandai dari panel detail setelah pekerjaan selesai.
export function MaintenanceFormDrawer({ open, onClose, plant, today, activity, initialDate, onSaved }: Props) {
  return (
    <Drawer open={open} onClose={onClose} title={activity ? "Edit Activity" : "Add O&M Activity"} footer={<FormFooter formId={activity ? `edit-${activity.id}` : "om-create"} editing={Boolean(activity)} onCancel={onClose} />}>
      {open && <MaintenanceForm key={activity?.id ?? `new-${initialDate ?? today}`} plant={plant} today={today} activity={activity} initialDate={initialDate} onSaved={onSaved} />}
    </Drawer>
  );
}

// Tombol footer memakai atribut form= supaya submit tetap lewat <form> di dalam body drawer.
function FormFooter({ formId, editing, onCancel }: { formId: string; editing: boolean; onCancel: () => void }) {
  return (
    <>
      <Button onClick={onCancel}>Cancel</Button>
      <Button type="submit" form={formId} variant="primary">
        {editing ? "Save Changes" : "Submit Activity"}
      </Button>
    </>
  );
}

function MaintenanceForm({ plant, today, activity, initialDate, onSaved }: Omit<Props, "open" | "onClose">) {
  const create = useCreateMaintenance(plant.id);
  const update = useUpdateMaintenance(plant.id);
  const id = useId();
  const formId = activity ? `edit-${activity.id}` : "om-create";
  const [draft, setDraft] = useState<MaintenanceDraft>(
    activity ? { date: activity.date, type: activity.type, activity: activity.activity, notes: activity.notes } : { date: initialDate ?? today, type: "REGULAR", activity: "", notes: "" },
  );
  const [errors, setErrors] = useState<MaintenanceDraftErrors>({});
  const [touched, setTouched] = useState(false);
  const pending = create.isPending || update.isPending;
  const error = create.error ?? update.error;

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
    try {
      const saved = activity
        ? await update.mutateAsync({ id: activity.id, patch: { date: draft.date, type: draft.type, activity: draft.activity, notes: draft.notes } })
        : await create.mutateAsync(draft);
      onSaved(saved);
    } catch (err) {
      const fromServer = fieldErrors(err, ["date", "type", "activity", "notes"] as const);
      if (fromServer) setErrors(fromServer);
    }
  };

  return (
    <form id={formId} onSubmit={(e) => void submit(e)} className="grid gap-5" noValidate aria-busy={pending}>
      <Field id={`${id}-type`} label="Type" required error={errors.type}>
        <Select id={`${id}-type`} value={draft.type} onChange={(e) => set("type", e.target.value as MaintenanceDraft["type"])} wrapperClassName="w-full" aria-invalid={!!errors.type}>
          {MAINTENANCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {MAINTENANCE_TYPE_LABEL[t]}
            </option>
          ))}
        </Select>
      </Field>
      <Field id={`${id}-date`} label="Schedule Date" required error={errors.date}>
        <Input id={`${id}-date`} type="date" value={draft.date} onChange={(e) => set("date", e.target.value)} aria-invalid={!!errors.date} required />
      </Field>
      <Field id={`${id}-activity`} label="O&M Activities" required error={errors.activity} hint={`${draft.activity.trim().length}/${ACTIVITY_MAX_LENGTH}`}>
        <Input id={`${id}-activity`} value={draft.activity} onChange={(e) => set("activity", e.target.value)} placeholder="e.g. Clean PV modules in block A" aria-invalid={!!errors.activity} maxLength={ACTIVITY_MAX_LENGTH} required />
      </Field>
      <Field id={`${id}-notes`} label="Notes" error={errors.notes} hint={`${draft.notes.length}/${NOTES_MAX_LENGTH}`}>
        <Textarea id={`${id}-notes`} value={draft.notes} onChange={(e) => set("notes", e.target.value.slice(0, NOTES_MAX_LENGTH))} placeholder="Preparation notes, tools, or assigned technician" maxLength={NOTES_MAX_LENGTH} />
      </Field>

      {error && (
        <Alert tone="danger" title="Couldn't save">
          {error.message}
        </Alert>
      )}
    </form>
  );
}
