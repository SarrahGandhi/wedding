"use client";

import { useState } from "react";
import type { IFuseOptions } from "fuse.js";
import type { GuestSide, RsvpStatus, SideFilter } from "@/lib/types";
import { useFuzzyFilter } from "@/lib/useFuzzyFilter";
import { InviteCheckbox } from "./InviteCheckbox";
import { InviteFamilyButton } from "./InviteFamilyButton";
import {
  DEFAULT_FUZZINESS,
  FuzzinessControl,
} from "@/app/shared/FuzzinessControl";
import { StatusIcon } from "@/app/shared/StatusIcon";
import { Button } from "@/app/shared/Button";

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

const SIDE_FILTERS: { value: SideFilter; label: string }[] = [
  { value: "ALL", label: "All families" },
  { value: "BRIDE", label: "Bride's side" },
  { value: "GROOM", label: "Groom's side" },
];

const STATUS_FILTERS: { value: RsvpStatus; label: string }[] = [
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DECLINED", label: "Declined" },
];

function filterByStatus(
  families: RosterFamily[],
  status: RsvpStatus | null,
): RosterFamily[] {
  if (status === null) return families;
  return families
    .map((family) => ({
      ...family,
      guests: family.guests.filter((guest) =>
        Object.values(guest.statusByEvent).includes(status),
      ),
    }))
    .filter((family) => family.guests.length > 0);
}

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
  const allInvited =
    family.guests.length > 0 &&
    family.guests.every((guest) =>
      events.every((event) => guest.statusByEvent[event.id] !== undefined),
    );

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
                        key={`${g.id}-${e.id}-${g.statusByEvent[e.id] ?? "uninvited"}`}
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
  const [fuzziness, setFuzziness] = useState(DEFAULT_FUZZINESS);
  const [statusFilter, setStatusFilter] = useState<RsvpStatus | null>(null);
  const [sideFilter, setSideFilter] = useState<SideFilter>("ALL");

  const matchedBride = filterByStatus(
    useFuzzyFilter(brideFamilies, search, searchOptions, fuzziness),
    statusFilter,
  );
  const matchedGroom = filterByStatus(
    useFuzzyFilter(groomFamilies, search, searchOptions, fuzziness),
    statusFilter,
  );
  const visibleBride = sideFilter === "GROOM" ? [] : matchedBride;
  const visibleGroom = sideFilter === "BRIDE" ? [] : matchedGroom;
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
            className="w-full max-w-md bg-warm-white border border-border/60 px-4 py-2.5 font-body text-base sm:text-sm focus:outline-none focus:border-accent/60 transition-colors placeholder:text-muted/60"
          />
        </label>
        <FuzzinessControl value={fuzziness} onChange={setFuzziness} />
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-2">
            Side
          </p>
          <div
            role="group"
            aria-label="Filter guests by side"
            className="inline-flex flex-wrap gap-2"
          >
            {SIDE_FILTERS.map((opt) => (
              <Button
                key={opt.value}
                aria-pressed={sideFilter === opt.value}
                variant={sideFilter === opt.value ? "primary" : "secondary"}
                onClick={() => setSideFilter(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-1 block">
            Filter by status
          </span>
          <div
            role="group"
            aria-label="Filter guests by RSVP status"
            className="flex flex-wrap gap-2"
          >
            {STATUS_FILTERS.map((opt) => {
              const active = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(active ? null : opt.value)}
                  className={`inline-flex items-center gap-2 border px-3 py-1.5 text-[10px] tracking-[0.25em] uppercase font-body transition-colors cursor-pointer ${
                    active
                      ? "border-foreground bg-cream text-foreground"
                      : "border-border/60 bg-warm-white text-text-secondary hover:border-foreground/40 hover:text-foreground"
                  }`}
                >
                  <StatusIcon status={opt.value} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {noResults ? (
        <p className="text-sm text-muted italic font-body">
          {search || statusFilter || sideFilter !== "ALL"
            ? "No guests or families match the current search and filters."
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
