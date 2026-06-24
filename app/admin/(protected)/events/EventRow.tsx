"use client";

import { useState } from "react";
import { updateEvent, deleteEvent } from "./actions";
import { FormField, TextareaField } from "@/app/shared/FormField";
import { Button } from "@/app/shared/Button";
import { ErrorMessage } from "@/app/shared/ErrorMessage";
import { useServerAction } from "@/app/shared/useServerAction";

type Event = {
  id: number;
  name: string;
  date: string;
  location: string | null;
  dress_code: string | null;
  details: string | null;
};

function toDateTimeLocalValue(value: string) {
  const [date, time = "00:00"] = value.replace(" ", "T").split("T");
  return `${date}T${time.slice(0, 5)}`;
}

function formatDateTime(value: string) {
  return new Date(toDateTimeLocalValue(value)).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
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
        `Delete event "${event.name}"? All RSVP records for this event will be removed.`
      )
    )
      return;
    remove.run(new FormData(e.currentTarget));
  }

  return (
    <article
      className={`border-t border-border/40 py-7 ${pending ? "opacity-60" : ""}`}
    >
      <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-4">
        <div>
          <h2 className="font-display italic text-3xl text-foreground leading-tight">
            {event.name}
          </h2>
          <p className="text-[10px] tracking-[0.3em] uppercase text-accent font-body mt-1 tabular-nums">
            {formatDateTime(event.date)}
          </p>
        </div>
        <div className="flex items-center gap-5 text-[10px] tracking-[0.25em] uppercase font-body">
          <span className="text-muted tabular-nums">#{event.id}</span>
          <Button
            variant="ghost"
            onClick={() => {
              setEditing((v) => !v);
              update.setError(null);
            }}
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
          <form onSubmit={onDelete} className="inline">
            <input type="hidden" name="id" value={event.id} />
            <Button variant="danger" type="submit" disabled={pending}>
              Delete
            </Button>
          </form>
        </div>
      </div>

      {editing ? (
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <input type="hidden" name="id" value={event.id} />
          <FormField
            label="Name"
            name="name"
            defaultValue={event.name}
            required
          />
          <FormField
            label="Date and time"
            name="date"
            type="datetime-local"
            defaultValue={toDateTimeLocalValue(event.date)}
            required
          />
          <FormField
            label="Location"
            name="location"
            defaultValue={event.location ?? ""}
          />
          <FormField
            label="Dress code"
            name="dress_code"
            defaultValue={event.dress_code ?? ""}
          />
          <TextareaField
            label="Details"
            name="details"
            rows={3}
            defaultValue={event.details ?? ""}
            labelClassName="md:col-span-2"
          />
          <div className="md:col-span-2">
            <Button type="submit" pending={pending}>
              {pending ? "…" : "Save changes"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3 text-sm font-body">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted font-body mb-1">
              Location
            </p>
            <p className="text-foreground">
              {event.location || (
                <span className="text-muted italic">Not set</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted font-body mb-1">
              Dress code
            </p>
            <p className="text-foreground italic">
              {event.dress_code || (
                <span className="text-muted not-italic">Not set</span>
              )}
            </p>
          </div>
          {event.details && (
            <div className="md:col-span-2 mt-2 border-l-2 border-accent/30 pl-4 text-text-secondary leading-relaxed">
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
