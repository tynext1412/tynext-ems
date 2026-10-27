import { Camera, Check, RotateCcw, Trash2 } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { MaintenanceUpdate } from "@/domains/maintenance/application/maintenance-repository";
import { useUpdateMaintenance } from "@/domains/maintenance/application/use-maintenance";
import { MAINTENANCE_TYPE_LABEL, maintenanceStatus, NOTES_MAX_LENGTH, type MaintenanceActivity, type MaintenancePhotoInput } from "@/domains/maintenance/domain/maintenance";
import { MaintenanceStatusBadge } from "@/domains/maintenance/ui/MaintenanceStatusBadge";
import type { Plant } from "@/domains/plant/domain/plant";
import { formatDateKey, formatDateTime, timezoneAbbrev } from "@/shared/domain/time";
import { cn } from "@/shared/lib/cn";
import { compressImage } from "@/shared/lib/image";
import { Button } from "@/shared/ui/Button";
import { Textarea } from "@/shared/ui/Input";

interface Props {
  activity: MaintenanceActivity;
  plant: Plant;
  today: string;
}

// Panel detail satu aktivitas: tandai selesai / batalkan, unggah & hapus foto, ubah catatan.
// Pasang `key={activity.id}` dari pemanggil supaya draft catatan ikut berganti.
export function MaintenanceDetail({ activity, plant, today }: Props) {
  const update = useUpdateMaintenance(plant.id);
  const tz = plant.location.timezone;
  const status = maintenanceStatus(activity, today);
  const notesId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState(activity.notes);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const patch = (p: MaintenanceUpdate) => update.mutateAsync({ id: activity.id, patch: p });

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    try {
      const photos: MaintenancePhotoInput[] = [];
      for (const file of Array.from(files)) photos.push(await compressImage(file));
      await patch({ addPhotos: photos });
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Foto gagal diunggah");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const notesDirty = notes !== activity.notes;

  return (
    <div className="grid gap-6">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <MaintenanceStatusBadge status={status} />
          <span className="rounded-sm border border-border px-1.5 py-0.5 text-xs text-muted">{MAINTENANCE_TYPE_LABEL[activity.type]}</span>
        </div>
        <p className="mt-2 text-base font-semibold">{activity.activity}</p>
        <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs text-muted sm:grid-cols-2">
          <div className="flex gap-2">
            <dt>Date</dt>
            <dd className="font-mono text-text">{formatDateKey(activity.date, "long")}</dd>
          </div>
          <div className="flex gap-2">
            <dt>Dibuat</dt>
            <dd className="font-mono text-text">{formatDateTime(activity.createdAt, tz)}</dd>
          </div>
          {activity.completedAt && (
            <div className="flex gap-2">
              <dt>Selesai</dt>
              <dd className="font-mono text-text">
                {formatDateTime(activity.completedAt, tz)} {timezoneAbbrev(tz)}
              </dd>
            </div>
          )}
        </dl>
      </div>

      <section aria-labelledby={`${notesId}-status`} className="grid gap-2">
        <h3 id={`${notesId}-status`} className="text-xs font-medium uppercase tracking-wide text-muted">
          Status
        </h3>
        {status === "DONE" ? (
          <Button onClick={() => void patch({ completedAt: null })} disabled={update.isPending} className="w-fit">
            <RotateCcw className="size-4" aria-hidden />
            Batalkan tanda selesai
          </Button>
        ) : (
          <Button variant="primary" onClick={() => void patch({ completedAt: new Date().toISOString() })} disabled={update.isPending} className="w-fit">
            <Check className="size-4" aria-hidden />
            Tandai selesai (Done)
          </Button>
        )}
        {status === "UPCOMING" && <p className="text-xs text-muted">Jadwal masih di depan; status berubah ke Pending otomatis saat tanggalnya tiba.</p>}
      </section>

      <section aria-labelledby={`${notesId}-photos`} className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <h3 id={`${notesId}-photos`} className="text-xs font-medium uppercase tracking-wide text-muted">
            Photo Documentation <span className="font-mono">({activity.photos.length})</span>
          </h3>
          <label className={cn("inline-flex h-9 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm hover:border-muted", uploading && "pointer-events-none opacity-50")}>
            <Camera className="size-4" aria-hidden />
            {uploading ? "Mengunggah…" : "Unggah foto"}
            <input ref={fileRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void onFiles(e.target.files)} disabled={uploading} />
          </label>
        </div>
        {uploadError && (
          <p role="alert" className="text-xs text-danger">
            {uploadError}
          </p>
        )}
        {activity.photos.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted">Belum ada foto. Foto diperkecil ke 1280 px sebelum disimpan.</p>
        ) : (
          <ul className="grid grid-cols-3 gap-2">
            {activity.photos.map((p) => (
              <li key={p.id} className={cn("group relative overflow-hidden rounded-md border border-border", expanded === p.id && "col-span-3")}>
                <button type="button" className="block w-full" onClick={() => setExpanded(expanded === p.id ? null : p.id)} aria-label={`${expanded === p.id ? "Perkecil" : "Perbesar"} ${p.name}`}>
                  <img src={p.dataUrl} alt={p.name} className={cn("w-full object-cover", expanded === p.id ? "max-h-96 object-contain" : "aspect-square")} />
                </button>
                <button
                  type="button"
                  onClick={() => void patch({ removePhotoIds: [p.id] })}
                  disabled={update.isPending}
                  aria-label={`Hapus foto ${p.name}`}
                  className="absolute right-1 top-1 inline-flex size-8 items-center justify-center rounded-md bg-bg/80 text-muted hover:text-danger focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor={notesId} className="text-xs font-medium uppercase tracking-wide text-muted">
            Notes
          </label>
          <span className="font-mono text-[11px] text-muted">
            {notes.length}/{NOTES_MAX_LENGTH}
          </span>
        </div>
        <Textarea id={notesId} value={notes} maxLength={NOTES_MAX_LENGTH} onChange={(e) => setNotes(e.target.value)} placeholder="Temuan di lapangan, part yang diganti, tindak lanjut" />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setNotes(activity.notes)} disabled={!notesDirty || update.isPending}>
            Urungkan
          </Button>
          <Button onClick={() => void patch({ notes })} disabled={!notesDirty || update.isPending}>
            Simpan catatan
          </Button>
        </div>
      </section>

      {update.error && (
        <p role="alert" className="text-sm text-danger">
          Perubahan gagal disimpan: {update.error.message}
        </p>
      )}
    </div>
  );
}
