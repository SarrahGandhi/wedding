"use client";

import { useRef, useState } from "react";
import { Search } from "lucide-react";
import type { GuestSide } from "@/lib/types";
import type { EventGuest } from "./actions";

const SIDES: { side: GuestSide; label: string; headerClassName: string }[] = [
  { side: "BRIDE", label: "Bride’s side", headerClassName: "bg-blush/55" },
  { side: "GROOM", label: "Groom’s side", headerClassName: "bg-sky/65" },
];

function normalizeName(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase().trim();
}

export function EventGuestDirectory({
  guests,
  eventId,
}: {
  guests: EventGuest[];
  eventId: number;
}) {
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const query = normalizeName(search);
  const words = query.split(/\s+/).filter(Boolean);
  const matchingGuests = guests.filter((guest) =>
    words.every((word) => normalizeName(guest.name).includes(word)),
  );
  const acceptedCount = guests.filter((guest) => guest.rsvpStatus === "ACCEPTED").length;
  const summaryId = `event-${eventId}-guest-summary`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div
            id={summaryId}
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="text-base font-medium leading-snug text-foreground tabular-nums">
              {acceptedCount} accepted / {guests.length} invited
            </p>
            {query && (
              <p className="mt-1 text-[15px] leading-snug text-text-secondary tabular-nums">
                Showing {matchingGuests.length} of {guests.length} guests
              </p>
            )}
          </div>
          <p className="mt-1 text-[15px] leading-snug text-text-secondary">
            Alphabetical by side. Scroll each list to see more names.
          </p>
        </div>
        <div className="w-full lg:max-w-sm">
          <label
            htmlFor={`event-${eventId}-guest-search`}
            className="mb-2 block text-[15px] font-medium text-foreground"
          >
            Find a guest
          </label>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
            />
            <input
              ref={searchRef}
              id={`event-${eventId}-guest-search`}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-describedby={summaryId}
              placeholder="Search names on both sides…"
              className="min-h-11 w-full rounded-xl border border-border/70 bg-warm-white py-2.5 pl-10 pr-16 text-base text-foreground placeholder:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground [&::-webkit-search-cancel-button]:appearance-none"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear guest search"
                onClick={() => {
                  setSearch("");
                  searchRef.current?.focus();
                }}
                className="absolute inset-y-0 right-1 min-h-11 cursor-pointer rounded-lg px-3 text-[15px] font-medium text-text-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-foreground"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2">
        {SIDES.map(({ side, label, headerClassName }) => {
          const sideGuests = guests.filter((guest) => guest.side === side);
          const total = sideGuests.length;
          const accepted = sideGuests.filter((guest) => guest.rsvpStatus === "ACCEPTED").length;
          const visible = matchingGuests.filter((guest) => guest.side === side);
          const headingId = `event-${eventId}-${side.toLowerCase()}-guests`;

          return (
            <section key={side} className="min-w-0 overflow-hidden rounded-xl bg-warm-white">
              <header className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 py-4 ${headerClassName}`}>
                <h3 id={headingId} className="font-display text-2xl leading-tight text-foreground">
                  {label}
                </h3>
                <div className="text-[15px] leading-snug text-text-secondary tabular-nums">
                  <p>{accepted} accepted / {total} invited</p>
                  {query && (
                    <p className="mt-1">Showing {visible.length} of {total} guests</p>
                  )}
                </div>
              </header>

              <div
                key={query}
                role="region"
                aria-labelledby={headingId}
                tabIndex={visible.length > 0 ? 0 : undefined}
                className="max-h-80 overflow-y-auto overscroll-contain p-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground sm:max-h-96"
              >
                {visible.length === 0 ? (
                  <p className="px-2 py-6 text-base leading-snug text-text-secondary">
                    {total === 0
                      ? "No invited guests on this side."
                      : "No names match this search."}
                  </p>
                ) : (
                  <ol role="list" className="space-y-0.5">
                    {visible.map((guest, index) => (
                      <li
                        key={guest.id}
                        className="flex min-h-11 items-baseline gap-3 rounded-lg px-2 py-2.5 even:bg-powder/55"
                      >
                        <span aria-hidden="true" className="w-8 shrink-0 text-right text-[15px] leading-snug text-text-secondary tabular-nums">
                          {index + 1}
                        </span>
                        <span
                          className={`min-w-0 break-words text-base leading-snug ${
                            guest.rsvpStatus === "ACCEPTED"
                              ? "text-emerald-700"
                              : guest.rsvpStatus === "DECLINED"
                                ? "text-red-700"
                                : "text-foreground"
                          }`}
                        >
                          {guest.name}
                        </span>
                        {guest.rsvpStatus === "ACCEPTED" && (
                          <span className="ml-auto shrink-0 text-[15px] font-medium leading-snug text-emerald-700">
                            Accepted
                          </span>
                        )}
                        {guest.rsvpStatus === "DECLINED" && (
                          <span className="ml-auto shrink-0 text-[15px] font-medium leading-snug text-red-700">
                            Declined
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
