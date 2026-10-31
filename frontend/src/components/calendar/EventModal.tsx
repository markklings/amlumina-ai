import { useState, type FormEvent } from "react";
import type { CalendarEvent, EventPayload } from "../../types/calendar";
import {
  blankForm,
  formFromEvent,
  toPayload,
  validateForm,
  withAllDay,
  type EventFormValues,
} from "../../lib/eventForm";
import FormError from "../auth/FormError";
import TextField from "../auth/TextField";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";
import ToggleTrack from "../ui/ToggleTrack";
import ColorPicker from "./ColorPicker";

interface Props {
  dayKey: string;
  event: CalendarEvent | null; // null = new event
  onClose: () => void; // must be stable
  onSave: (payload: EventPayload, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function EventModal({
  dayKey,
  event,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const [v, setV] = useState<EventFormValues>(() =>
    event ? formFromEvent(event) : blankForm(dayKey),
  );
  const [errors, setErrors] = useState<{ title?: string; end?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const busy = saving || deleting;

  const patch = (p: Partial<EventFormValues>) => {
    setV((cur) => ({ ...cur, ...p }));
    setErrors({});
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validateForm(v);
    setErrors(found);
    if (found.title || found.end) return;

    setSaving(true);
    setFormError(null);
    try {
      await onSave(toPayload(v), event?.id);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save. Try again.",
      );
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!event) return;
    setDeleting(true);
    setFormError(null);
    try {
      await onDelete(event.id);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not delete. Try again.",
      );
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const inputType = v.allDay ? "date" : "datetime-local";

  return (
    <Dialog
      open
      onClose={onClose}
      title={event ? "Edit event" : "New event"}
      footer={
        <>
          {event &&
            (confirmDelete ? (
              <Button className="mr-auto" loading={deleting} onClick={remove}>
                Confirm delete
              </Button>
            ) : (
              <Button
                className="mr-auto"
                disabled={busy}
                onClick={() => setConfirmDelete(true)}
              >
                Delete
              </Button>
            ))}
          <Button onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="event-form"
            variant="primary"
            loading={saving}
            disabled={deleting}
          >
            Save
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={submit} noValidate className="space-y-3">
        {formError && <FormError message={formError} />}
        <TextField
          label="Title"
          value={v.title}
          onChange={(e) => patch({ title: e.target.value })}
          error={errors.title}
          maxLength={255}
        />

        <button
          type="button"
          role="switch"
          aria-checked={v.allDay}
          onClick={() => setV((cur) => withAllDay(cur, !cur.allDay))}
          className="flex w-full items-center justify-between rounded-lg border border-zinc-200 px-3.5 py-2.5 text-sm font-medium dark:border-zinc-800"
        >
          All day
          <ToggleTrack on={v.allDay} />
        </button>

        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="Starts"
            type={inputType}
            value={v.start}
            onChange={(e) => patch({ start: e.target.value })}
          />
          <TextField
            label="Ends"
            type={inputType}
            value={v.end}
            onChange={(e) => patch({ end: e.target.value })}
            error={errors.end}
          />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">Color</p>
          <ColorPicker value={v.color} onChange={(color) => patch({ color })} />
        </div>

        <div>
          <label
            htmlFor="event-notes"
            className="mb-1.5 block text-sm font-medium"
          >
            Notes
          </label>
          <textarea
            id="event-notes"
            rows={3}
            maxLength={2000}
            value={v.description}
            onChange={(e) => patch({ description: e.target.value })}
            className="w-full resize-none rounded-lg border border-zinc-200 bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-100"
          />
        </div>
      </form>
    </Dialog>
  );
}
