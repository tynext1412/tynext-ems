import { Bell, Check, Clock, Pencil, RotateCcw, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import type { MaintenanceUpdate } from "@/domains/maintenance/application/maintenance-repository";
import { useUpdateMaintenance } from "@/domains/maintenance/application/use-maintenance";
import { maintenanceStatus, NOTES_MAX_LENGTH, type MaintenanceActivity, type MaintenancePhotoInput } from "@/domains/maintenance/domain/maintenance";
import { MaintenanceStatusBadge } from "@/domains/maintenance/ui/MaintenanceStatusBadge";
import { MaintenanceTypeTag } from "@/domains/maintenance/ui/MaintenanceTypeTag";
import type { Plant } from "@/domains/plant/domain/plant";
import { cn } from "@/shared/lib/cn";
import { compressImage } from "@/shared/lib/image";
import { Alert } from "@/shared/ui/Alert";
import { Button } from "@/shared/ui/Button";
import { Drawer } from "@/shared/ui/Drawer";
import { Skeleton } from "@/shared/ui/Skeleton";
import { Textarea } from "@/shared/ui/Input";
import { formatCreatedAt, formatScheduleDate } from "./om-format";

interface Props {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  activity?: MaintenanceActivity; // undefined selama daftar dimuat / id tidak ditemukan
  activityId: string | null;
  loading: boolean;
  plant: Plant;
  today: string;
}

// Drawer "Activity Details": judul, status + tipe, tanggal jadwal/dibuat, dokumentasi foto, catatan,
// dan aksi (Edit, Mark as Done / Reopen). Foto bisa diunggah dan dihapus; catatan diubah di tempat.
export function MaintenanceDetailDrawer({ open, onClose, onEdit, activity, activityId, loading, plant, today }: Props) {
  const update = useUpdateMaintenance(plant.id);
  const status = activity ? maintenanceStatus(activity, today) : undefined;

  const setDone = (done: boolean) => {
    if (!activity) return;
    update.mutate({ id: activity.id, patch: { completedAt: done ? new Date().toISOString() : null } });
  };

  const footer = activity ? (
    status === "DONE" ? (
      <Button onClick={() => setDone(false)} loading={update.isPending}>
        <RotateCcw className="size-4" aria-hidden />
        Reopen Activity
      </Button>
    ) : (
      <>
        <Button onClick={onEdit} disabled={update.isPending}>
          <Pencil className="size-4" aria-hidden />
          Edit
        </Button>
        <Button variant="primary" onClick={() => setDone(true)} loading={update.isPending}>
          <Check className="size-4" aria-hidden />
          Mark as Done
        </Button>
      </>
    )
  ) : undefined;

  return (
    <Drawer open={open} onClose={onClose} title="Activity Details" footer={footer} className="[&>div:nth-child(2)]:p-0">
      {activity ? (
        <MaintenanceDetail key={activity.id} activity={activity} plant={plant} status={status ?? "UPCOMING"} updateError={update.error} />
      ) : loading ? (
        <div className="grid gap-3 p-5" aria-busy>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : (
        <p className="p-5 text-sm text-muted">
          Activity <span className="font-mono">{activityId}</span> isn't in this plant.
        </p>
      )}
    </Drawer>
  );
}

function MaintenanceDetail({ activity, plant, status, updateError }: { activity: MaintenanceActivity; plant: Plant; status: ReturnType<typeof maintenanceStatus>; updateError: Error | null }) {
  const update = useUpdateMaintenance(plant.id);
  const tz = plant.location.timezone;
  const notesId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState(activity.notes);
  const [editingNotes, setEditingNotes] = useState(false);
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
      setUploadError(e instanceof Error ? e.message : "Photo upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveNotes = async () => {
    await patch({ notes });
    setEditingNotes(false);
  };

  return (
    <div className="flex min-h-full flex-col">
      <section className="border-b border-separator p-5">
        <h3 className="text-lg font-semibold leading-7">{activity.activity}</h3>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <MaintenanceStatusBadge status={status} />
          <span className="h-5 w-px bg-border" aria-hidden />
          <MaintenanceTypeTag type={activity.type} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <DateTile icon={<Bell className="size-4 text-accent" aria-hidden />} label="Scheduled Date" value={formatScheduleDate(activity.date, "long")} />
          <DateTile icon={<Clock className="size-4 text-accent" aria-hidden />} label="Created Date" value={formatCreatedAt(activity.createdAt, tz)} />
        </div>
      </section>

      <section className="border-b border-separator p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold">Photo Documentation ({activity.photos.length})</h4>
            <p className="mt-0.5 text-xs text-muted">Upload photo from the field as proof of work</p>
          </div>
          <Button size="sm" onClick={() => fileRef.current?.click()} loading={uploading} disabled={update.isPending && !uploading}>
            <Upload className="size-4" aria-hidden />
            Upload Photos
          </Button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png" multiple className="sr-only" onChange={(e) => void onFiles(e.target.files)} disabled={uploading} aria-label="Choose photos" />
        </div>
        {uploadError && (
          <p role="alert" className="mt-2 text-xs text-danger-text">
            {uploadError}
          </p>
        )}
        {activity.photos.length === 0 ? (
          <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="mt-4 grid h-24 w-full place-items-center rounded-xl border border-dashed border-border text-sm text-muted hover:border-muted hover:text-text disabled:opacity-50">
            No photos yet
          </button>
        ) : (
          <ul className="mt-4 grid grid-cols-5 gap-2">
            {activity.photos.map((p) => (
              <li key={p.id} className={cn("group relative overflow-hidden rounded-xl border border-border", expanded === p.id && "col-span-5")}>
                <button type="button" className="block w-full" onClick={() => setExpanded(expanded === p.id ? null : p.id)} aria-label={`${expanded === p.id ? "Collapse" : "Expand"} ${p.name}`}>
                  <img src={p.dataUrl} alt={p.name} className={cn("w-full object-cover", expanded === p.id ? "max-h-96 object-contain" : "aspect-square")} />
                </button>
                <button
                  type="button"
                  onClick={() => void patch({ removePhotoIds: [p.id] })}
                  disabled={update.isPending}
                  aria-label={`Remove photo ${p.name}`}
                  className="absolute right-1 top-1 inline-flex size-7 items-center justify-center rounded-lg bg-surface/90 text-muted shadow-surface hover:text-danger-text focus:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted">Only support .jpg and .png files</p>
      </section>

      <section className="p-5">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={notesId} className="text-sm font-semibold">
            Notes
          </label>
          {editingNotes ? (
            <span className="font-mono text-xs text-muted">
              {notes.length}/{NOTES_MAX_LENGTH}
            </span>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setEditingNotes(true)} disabled={update.isPending}>
              <Pencil className="size-3.5" aria-hidden />
              {activity.notes ? "Edit notes" : "Add notes"}
            </Button>
          )}
        </div>
        {editingNotes ? (
          <div className="mt-2 grid gap-2">
            <Textarea id={notesId} value={notes} maxLength={NOTES_MAX_LENGTH} onChange={(e) => setNotes(e.target.value)} placeholder="Field findings, parts replaced, follow-up" />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNotes(activity.notes);
                  setEditingNotes(false);
                }}
                disabled={update.isPending}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => void saveNotes()} loading={update.isPending} disabled={notes === activity.notes}>
                Save notes
              </Button>
            </div>
          </div>
        ) : (
          <p id={notesId} className={cn("mt-2 whitespace-pre-wrap text-sm", activity.notes ? "text-text" : "text-muted")}>
            {activity.notes || "No notes"}
          </p>
        )}
      </section>

      {(update.error || updateError) && (
        <div className="px-5 pb-5">
          <Alert tone="danger" title="Changes couldn't be saved">
            {(update.error ?? updateError)?.message}
          </Alert>
        </div>
      )}

      {status === "UPCOMING" && (
        <div className="mt-auto px-5 pb-5">
          <Alert tone="info">This activity is still scheduled. Its status changes to Pending automatically when the date arrives.</Alert>
        </div>
      )}
    </div>
  );
}

function DateTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-sm font-medium text-text">{value}</div>
    </div>
  );
}
