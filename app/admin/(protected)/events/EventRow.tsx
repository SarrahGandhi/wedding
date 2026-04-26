"use client";

import { useState, useTransition } from "react";
import { updateEvent, deleteEvent } from "./actions";

type Event = {
  id: number;
  name: string;
  date: string;
  location: string | null;
  dress_code: string | null;
  details: string | null;
};

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function EventRow({ event }: { event: Event }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateEvent(formData);
      if (result.error) setError(result.error);
      else setEditing(false);
    });
  }

  function onDelete(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !confirm(
        `Delete event "${event.name}"? All RSVP records for this event will be removed.`
      )
    )
      return;
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await deleteEvent(formData);
      if (result.error) setError(result.error);
    });
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
            {formatDate(event.date)}
          </p>
        </div>
        <div className="flex items-center gap-5 text-[10px] tracking-[0.25em] uppercase font-body">
          <span className="text-muted tabular-nums">#{event.id}</span>
          <button
            type="button"
            onClick={() => {
              setEditing((v) => !v);
              setError(null);
            }}
            className="text-text-secondary hover:text-accent transition-colors cursor-pointer"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
          <form onSubmit={onDelete} className="inline">
            <input type="hidden" name="id" value={event.id} />
            <button
              type="submit"
              disabled={pending}
              className="text-text-secondary hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      {editing ? (
        <form
          onSubmit={onSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <input type="hidden" name="id" value={event.id} />
          <label className="block">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Name
            </span>
            <input
              name="name"
              defaultValue={event.name}
              required
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Date
            </span>
            <input
              name="date"
              type="date"
              defaultValue={event.date}
              required
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Location
            </span>
            <input
              name="location"
              defaultValue={event.location ?? ""}
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Dress code
            </span>
            <input
              name="dress_code"
              defaultValue={event.dress_code ?? ""}
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Details
            </span>
            <textarea
              name="details"
              rows={3}
              defaultValue={event.details ?? ""}
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm leading-relaxed focus:outline-none focus:border-accent/60 transition-colors resize-y"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="px-5 py-2 bg-foreground text-background text-[10px] tracking-[0.3em] uppercase font-body hover:bg-accent transition-colors disabled:opacity-40 cursor-pointer"
            >
              {pending ? "…" : "Save changes"}
            </button>
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
        <p className="mt-3 text-xs text-red-500 font-body">{error}</p>
      )}
    </article>
  );
}
