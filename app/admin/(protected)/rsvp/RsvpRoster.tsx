"use client";

import { useState } from "react";
import type { GuestSide, RsvpStatus } from "@/lib/types";
import { InviteCheckbox } from "./InviteCheckbox";

export type RosterEvent = {
  id: number;
  name: string;
};

export type RosterGuest = {
  id: number;
  name: string;
  statusByEvent: Record<number, RsvpStatus>;
};

export type RosterFamily = {
  id: number;
  side: GuestSide;
  label: string;
  guests: RosterGuest[];
};

function fuzzyMatch(text: string, query: string): boolean {
  const t = text.toLowerCase();
  const q = query.toLowerCase().replace(/\s+/g, "");
  if (q.length === 0) return true;
  if (t.includes(query.toLowerCase().trim())) return true;
  // Subsequence match: every query character appears in order.
  let i = 0;
  for (const ch of t) {
    if (ch === q[i]) i += 1;
    if (i === q.length) return true;
  }
  return false;
}

function matchesSearch(family: RosterFamily, query: string): boolean {
  if (fuzzyMatch(family.label, query)) return true;
  return family.guests.some((g) => fuzzyMatch(g.name, query));
}

function FamilyBlock({
  family,
  events,
}: {
  family: RosterFamily;
  events: RosterEvent[];
}) {
  return (
    <article className="border-t border-border/40 py-6">
      <header className="flex items-baseline gap-3 flex-wrap mb-4">
        <h2 className="font-display italic text-2xl text-foreground leading-tight">
          {family.label}
        </h2>
        <span className="text-[10px] tracking-[0.25em] uppercase font-body text-text-secondary tabular-nums">
          {family.guests.length}{" "}
          {family.guests.length === 1 ? "guest" : "guests"}
        </span>
        <span className="text-[10px] tracking-[0.3em] uppercase text-muted font-body tabular-nums">
          #{family.id}
        </span>
      </header>

      {family.guests.length === 0 ? (
        <p className="text-sm text-muted italic font-body">
          No guests in this family yet.
        </p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left py-2 px-2 w-1/3 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                Name
              </th>
              <th className="text-left py-2 px-2 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                Invitations
              </th>
            </tr>
          </thead>
          <tbody>
            {family.guests.map((g) => (
              <tr
                key={g.id}
                className="border-b border-border/30 hover:bg-cream/30 transition-colors"
              >
                <td className="py-3 px-2 font-display text-lg text-foreground align-top">
                  {g.name}
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {events.map((e) => (
                      <InviteCheckbox
                        key={`${g.id}-${e.id}`}
                        guestId={g.id}
                        eventId={e.id}
                        eventName={e.name}
                        status={g.statusByEvent[e.id] ?? null}
                      />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </article>
  );
}

export function RsvpRoster({
  brideFamilies,
  groomFamilies,
  events,
}: {
  brideFamilies: RosterFamily[];
  groomFamilies: RosterFamily[];
  events: RosterEvent[];
}) {
  const [search, setSearch] = useState("");

  const visibleBride = search
    ? brideFamilies.filter((f) => matchesSearch(f, search))
    : brideFamilies;
  const visibleGroom = search
    ? groomFamilies.filter((f) => matchesSearch(f, search))
    : groomFamilies;
  const noResults = visibleBride.length === 0 && visibleGroom.length === 0;

  return (
    <>
      <div className="mb-10">
        <label className="block">
          <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-1 block">
            Search guests
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a guest or family name…"
            className="w-full max-w-md bg-warm-white border border-border/60 px-4 py-2.5 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors placeholder:text-muted/60"
          />
        </label>
      </div>

      {noResults ? (
        <p className="text-sm text-muted italic font-body">
          {search
            ? `No guests or families match “${search}”`
            : "No families yet — add them from the Roster chapter first."}
        </p>
      ) : (
        <>
          {visibleBride.length > 0 && (
            <section className="mb-12">
              <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-2">
                Bride&apos;s side
              </p>
              <div className="w-10 h-px bg-accent/40 mb-2" />
              {visibleBride.map((f) => (
                <FamilyBlock key={f.id} family={f} events={events} />
              ))}
            </section>
          )}

          {visibleGroom.length > 0 && (
            <section>
              <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-2">
                Groom&apos;s side
              </p>
              <div className="w-10 h-px bg-accent/40 mb-2" />
              {visibleGroom.map((f) => (
                <FamilyBlock key={f.id} family={f} events={events} />
              ))}
            </section>
          )}
        </>
      )}
    </>
  );
}
