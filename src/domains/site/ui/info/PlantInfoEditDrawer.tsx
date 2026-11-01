import { useDeferredValue, useId, useState, type ReactNode } from "react";
import { useUpdatePlantInfo } from "@/domains/plant/application/use-plants";
import { PLANT_TYPE_LABEL, PLANT_TYPES, type Plant, type PlantType } from "@/domains/plant/domain/plant";
import { ADDRESS_MAX, applyInfo, infoOf, NAME_MAX, parseCoordinate, PLANT_TIME_ZONES, validateInfo, type PlantInfoErrors, type PlantInfoUpdate } from "@/domains/plant/domain/plant-info";
import { PlantLocationMap } from "@/domains/plant/ui/PlantLocationMap";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Drawer } from "@/shared/ui/Drawer";
import { Field, Input, Select, Textarea } from "@/shared/ui/Input";

interface Props {
  open: boolean;
  onClose: () => void;
  plant: Plant;
}

const FORM_ID = "plant-info-form";

// Koordinat disimpan sebagai teks di draft supaya pengguna bebas mengetik "-0.0263" atau "S0.026300".
type Draft = Omit<PlantInfoUpdate, "lat" | "lng"> & { lat: string; lng: string };

function toUpdate(draft: Draft): PlantInfoUpdate {
  return { ...draft, lat: parseCoordinate(draft.lat, "lat"), lng: parseCoordinate(draft.lng, "lng") };
}

// Drawer "Edit Information": nama, jenis, dan zona waktu plant; alamat dan koordinat (dengan
// pratinjau peta); pemilik, kontak, organisasi, dan installer.
export function PlantInfoEditDrawer({ open, onClose, plant }: Props) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Edit Information"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form={FORM_ID} variant="primary">
            Save Changes
          </Button>
        </>
      }
    >
      {open && <PlantInfoForm plant={plant} onSaved={onClose} />}
    </Drawer>
  );
}

function PlantInfoForm({ plant, onSaved }: { plant: Plant; onSaved: () => void }) {
  const id = useId();
  const update = useUpdatePlantInfo(plant.id);
  const [draft, setDraft] = useState<Draft>(() => {
    const info = infoOf(plant);
    return { ...info, lat: info.lat.toFixed(6), lng: info.lng.toFixed(6) };
  });
  const [errors, setErrors] = useState<PlantInfoErrors>({});
  const [touched, setTouched] = useState(false);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (touched) setErrors(validateInfo(toUpdate(next)));
  };

  // Pratinjau peta memakai koordinat yang sudah valid; ditunda supaya tidak memasang ulang peta tiap ketukan.
  const parsed = toUpdate(draft);
  const coordsValid = !validateInfo(parsed).lat && !validateInfo(parsed).lng;
  const preview = useDeferredValue(coordsValid ? applyInfo(plant, parsed) : null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = toUpdate(draft);
    const found = validateInfo(next);
    setErrors(found);
    setTouched(true);
    if (Object.keys(found).length > 0) return;
    await update.mutateAsync(next);
    onSaved();
  };

  const text = (key: "name" | "address" | "ownerName" | "ownerContactEmail" | "organization" | "installer") => ({
    id: `${id}-${key}`,
    value: draft[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(key, e.target.value),
    "aria-invalid": !!errors[key],
  });

  return (
    <form id={FORM_ID} onSubmit={(e) => void submit(e)} className="grid gap-6" noValidate aria-busy={update.isPending}>
      <Section title="Basic Information">
        <Field id={`${id}-name`} label="Plant Name" required error={errors.name} hint={`${draft.name.trim().length}/${NAME_MAX}`}>
          <Input {...text("name")} maxLength={NAME_MAX} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${id}-type`} label="Plant Type" required>
            <Select id={`${id}-type`} value={draft.plantType} onChange={(e) => set("plantType", e.target.value as PlantType)} wrapperClassName="w-full">
              {PLANT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PLANT_TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={`${id}-tz`} label="Time Zone" required error={errors.timezone}>
            <Select id={`${id}-tz`} value={draft.timezone} onChange={(e) => set("timezone", e.target.value)} wrapperClassName="w-full" aria-invalid={!!errors.timezone}>
              {!PLANT_TIME_ZONES.some((z) => z.id === draft.timezone) && <option value={draft.timezone}>{draft.timezone}</option>}
              {PLANT_TIME_ZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Section>

      <Section title="Location">
        <Field id={`${id}-address`} label="Address" required error={errors.address} hint={`${draft.address.trim().length}/${ADDRESS_MAX}`}>
          <Textarea {...text("address")} rows={2} maxLength={ADDRESS_MAX} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${id}-lat`} label="Latitude" required error={errors.lat}>
            <Input id={`${id}-lat`} inputMode="decimal" value={draft.lat} onChange={(e) => set("lat", e.target.value)} aria-invalid={!!errors.lat} placeholder="-0.026300 or S0.026300" required />
          </Field>
          <Field id={`${id}-lng`} label="Longitude" required error={errors.lng}>
            <Input id={`${id}-lng`} inputMode="decimal" value={draft.lng} onChange={(e) => set("lng", e.target.value)} aria-invalid={!!errors.lng} placeholder="109.342500 or E109.342500" required />
          </Field>
        </div>
        {preview ? (
          <PlantLocationMap plant={preview} className="isolate h-40 rounded-xl" />
        ) : (
          <p className="grid h-40 place-items-center rounded-xl bg-surface-2 text-xs text-muted">Enter valid coordinates to preview the location.</p>
        )}
      </Section>

      <Section title="Organization & Contact">
        <Field id={`${id}-ownerName`} label="Owner" required error={errors.ownerName}>
          <Input {...text("ownerName")} maxLength={NAME_MAX} required />
        </Field>
        <Field id={`${id}-ownerContactEmail`} label="Owner’s Contact" required error={errors.ownerContactEmail}>
          <Input {...text("ownerContactEmail")} type="email" inputMode="email" autoComplete="off" placeholder="name@company.co.id" required />
        </Field>
        <Field id={`${id}-organization`} label="Assigner Organization" error={errors.organization} hint="Optional">
          <Input {...text("organization")} maxLength={NAME_MAX} />
        </Field>
        <Field id={`${id}-installer`} label="Installer" required error={errors.installer}>
          <Input {...text("installer")} maxLength={NAME_MAX} required />
        </Field>
      </Section>

      {update.error && (
        <Alert tone="danger" title="Couldn't save">
          {update.error.message}
        </Alert>
      )}
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="grid gap-4">
      <legend className="mb-3 text-sm font-semibold text-text">{title}</legend>
      {children}
    </fieldset>
  );
}
