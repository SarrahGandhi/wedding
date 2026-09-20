"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import { ErrorMessage } from "@/app/shared/ErrorMessage";
import { getEventGuests, type EventGuest } from "./actions";
import { EventGuestDirectory } from "./EventGuestDirectory";

export function EventGuestList({
  eventId,
  eventName,
}: {
  eventId: number;
  eventName: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [guests, setGuests] = useState<EventGuest[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listId = `event-${eventId}-guests`;
  const toggleId = `${listId}-toggle`;

  function loadGuests() {
    setGuests(null);
    setError(null);
    startTransition(async () => {
      try {
        const result = await getEventGuests(eventId);
        if (result.guests) setGuests(result.guests);
        else setError(result.error);
      } catch {
        setError("Unable to load the guest list. Please try again.");
      }
    });
  }

  function toggleGuests() {
    setExpanded(!expanded);
    if (!expanded) loadGuests();
  }

  return (
    <div className="mt-5 font-body">
      <button
        id={toggleId}
        type="button"
        onClick={toggleGuests}
        disabled={pending}
        aria-expanded={expanded}
        aria-controls={listId}
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-sm text-base font-medium text-foreground underline decoration-foreground/35 decoration-1 underline-offset-4 transition-colors hover:text-tangerine focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground disabled:cursor-wait disabled:opacity-60"
      >
        {expanded ? "Hide guest list" : "View guest list"}
        <span className="sr-only"> for {eventName}</span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <section
        id={listId}
        aria-labelledby={toggleId}
        aria-busy={pending}
        hidden={!expanded}
        className="mt-3 rounded-2xl border border-white/70 bg-powder/45 p-4 sm:p-5"
      >
        <div role="status" aria-live="polite">
          {pending && (
            <p className="text-base text-text-secondary">Loading guest names…</p>
          )}
          {error && (
            <>
              <ErrorMessage>{error}</ErrorMessage>
              <button
                type="button"
                onClick={loadGuests}
                className="mt-2 min-h-11 cursor-pointer rounded-sm text-base font-medium text-foreground underline decoration-1 underline-offset-4 hover:text-tangerine focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
              >
                Try again
              </button>
            </>
          )}
          {guests?.length === 0 && (
            <>
              <p className="text-base font-medium leading-snug text-foreground tabular-nums">
                0 accepted / 0 invited
              </p>
              <p className="mt-1 text-base leading-snug text-text-secondary">
                No guests have been invited to this event yet.
              </p>
            </>
          )}
        </div>
        {guests && guests.length > 0 && (
          <EventGuestDirectory guests={guests} eventId={eventId} />
        )}
      </section>
    </div>
  );
}
