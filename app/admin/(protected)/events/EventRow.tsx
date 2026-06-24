"use client";

import { useState } from "react";
import { updateEvent, deleteEvent } from "./actions";
import { FormField, TextareaField } from "@/app/shared/FormField";
import { Button } from "@/app/shared/Button";
import { ErrorMessage } from "@/app/shared/ErrorMessage";
import { useServerAction } from "@/app/shared/useServerAction";
import {
  formatEventDateTime,
  toDateInputValue,
  toTimeInputValue,
} from "@/app/shared/event-date-time";

type Event = {
  id: number;
  name: string;
  date: string;
  time: string | null;
  location: string | null;
  dress_code: string | null;
  details: string | null;
};

function formatDate(date: string, time: string | null) {
  return formatEventDateTime(date, time, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(date: string, time: string | null) {
  if (!time) return "Time not set";

  return formatEventDateTime(date, time, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function EventRow({ event }: { event: Event }) {
  const [editing, setEditing] = useState(false);
  const update = useServerAction(updateEvent);
  const remove = useServerAction(deleteEvent);
  const pending = update.pending || remove.pending;
  const error = update.error || remove.error;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    update.runForm(e, { onSuccess: () => setEditing(false) });
  }

  function onDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !confirm(
        `Delete event “${event.name}”? All RSVP records for this event will be removed.`
      )
    )
      return;
    remove.run(new FormData(e.currentTarget));
  }

  return (
    <article
      className={`rounded-[1.75rem] border border-white/70 bg-warm-white/70 p-5 shadow-[0_14px_30px_-18px_rgba(90,80,90,0.35)] transition-opacity sm:p-6 ${
        pending ? "opacity-60" : ""
      }`}
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-body uppercase tracking-[0.22em] text-tangerine tabular-nums">
            {formatDate(event.date, event.time)}
          </p>
          <h2 className="font-display display-wonk text-3xl font-light leading-tight text-foreground sm:text-4xl">
            {event.name}
          </h2>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 text-[10px] font-body uppercase tracking-[0.22em]">
          <span className="rounded-full bg-powder px-3 py-2 text-muted tabular-nums">
            #{event.id}
          </span>
          <Button
            variant="ghost"
            className="rounded-full bg-peach/45 px-4 py-2 text-tangerine hover:bg-peach/70"
            onClick={() => {
              setEditing((v) => !v);
              update.setError(null);
            }}
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
          <form onSubmit={onDelete} className="inline">
            <input type="hidden" name="id" value={event.id} />
            <Button
              variant="danger"
              type="submit"
              disabled={pending}
              className="rounded-full bg-blush/45 px-4 py-2 text-rose hover:bg-blush/75"
            >
              Delete
            </Button>
          </form>
        </div>
      </div>

      {editing ? (
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 gap-4 rounded-[1.5rem] border border-white/70 bg-powder/55 p-4 md:grid-cols-2"
        >
          <input type="hidden" name="id" value={event.id} />
          <FormField
            label="Name"
            name="name"
            size="lg"
            defaultValue={event.name}
            required
          />
          <FormField
            label="Date"
            name="date"
            type="date"
            size="lg"
            defaultValue={toDateInputValue(event.date)}
            required
          />
          <FormField
            label="Time"
            name="time"
            type="time"
            size="lg"
            defaultValue={toTimeInputValue(event.time)}
            required
          />
          <FormField
            label="Location"
            name="location"
            size="lg"
            defaultValue={event.location ?? ""}
          />
          <FormField
            label="Dress code"
            name="dress_code"
            size="lg"
            defaultValue={event.dress_code ?? ""}
          />
          <TextareaField
            label="Details"
            name="details"
            size="lg"
            rows={3}
            defaultValue={event.details ?? ""}
            labelClassName="md:col-span-2"
          />
          <div className="md:col-span-2">
            <Button
              type="submit"
              pending={pending}
              className="rounded-full px-7 py-3"
            >
              {pending ? "…" : "Save changes"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-3 font-body md:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-powder/45 p-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-text-secondary">
              Time
            </p>
            <p className="text-base leading-snug text-foreground tabular-nums sm:text-lg">
              {formatTime(event.date, event.time)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-powder/45 p-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-text-secondary">
              Location
            </p>
            <p className="text-base leading-snug text-foreground sm:text-lg">
              {event.location || (
                <span className="text-muted">Not set</span>
              )}
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-powder/45 p-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-text-secondary">
              Dress code
            </p>
            <p className="text-base leading-snug text-foreground sm:text-lg">
              {event.dress_code || (
                <span className="text-muted">Not set</span>
              )}
            </p>
          </div>
          {event.details && (
            <div className="mt-1 rounded-2xl border border-white/70 bg-powder/60 p-4 text-base leading-relaxed text-text-secondary md:col-span-2">
              {event.details}
            </div>
          )}
        </div>
      )}

      {error && (
        <ErrorMessage variant="inline" className="mt-3">
          {error}
        </ErrorMessage>
      )}
    </article>
  );
}
