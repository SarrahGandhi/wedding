"use client";

import { useState } from "react";
import type { IFuseOptions } from "fuse.js";
import type { GuestSide, RsvpStatus } from "@/lib/types";
import { useFuzzyFilter } from "@/lib/useFuzzyFilter";
import { InviteCheckbox } from "./InviteCheckbox";
import { InviteFamilyButton } from "./InviteFamilyButton";
import {
  DEFAULT_FUZZINESS,
  FuzzinessControl,
} from "@/app/shared/FuzzinessControl";

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

const searchOptions: IFuseOptions<RosterFamily> = {
  ignoreLocation: true,
  keys: [
    { name: "label", weight: 2 },
    { name: "guests.name" },
    { name: "familyId", getFn: (family) => String(family.id) },
  ],
};

function FamilyBlock({
  family,
  events,
}: {
  family: RosterFamily;
  events: RosterEvent[];
}) {
  const [inviteAllSignal, setInviteAllSignal] = useState(0);
  const allInvitedFromServer =
    family.guests.length > 0 &&
    family.guests.every((guest) =>
      events.every((event) => guest.statusByEvent[event.id] !== undefined),
    );
  const allInvited = allInvitedFromServer || inviteAllSignal > 0;

  return (
    <article className="border-t border-border/40 py-6">
      <header className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-baseline sm:justify-between">
        <div className="flex items-baseline gap-3 flex-wrap">
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
        </div>
        {family.guests.length > 0 && (
          <InviteFamilyButton
            familyId={family.id}
            allInvited={allInvited}
            onInvitedAll={() => setInviteAllSignal((signal) => signal + 1)}
          />
        )}
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
                        key={`${g.id}-${e.id}-${g.statusByEvent[e.id] ?? "uninvited"}-${inviteAllSignal}`}
                        guestId={g.id}
                        eventId={e.id}
                        eventName={e.name}
                        status={g.statusByEvent[e.id] ?? null}
                        inviteAllSignal={inviteAllSignal}
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
  const [fuzziness, setFuzziness] = useState(DEFAULT_FUZZINESS);

  const visibleBride = useFuzzyFilter(
    brideFamilies,
    search,
    searchOptions,
    fuzziness,
  );
  const visibleGroom = useFuzzyFilter(
    groomFamilies,
    search,
    searchOptions,
    fuzziness,
  );
  const noResults = visibleBride.length === 0 && visibleGroom.length === 0;

  return (
    <>
      <div className="mb-10 space-y-5">
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
        <FuzzinessControl value={fuzziness} onChange={setFuzziness} />
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
