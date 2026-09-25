"use client";

import Link from "next/link";
import { useState } from "react";
import { FormField, SelectField } from "@/app/shared/FormField";
import { formatArrival, groupByAccommodation, matchesFamily, sortAccommodationFamilies, travelSummary, type AccommodationGroup, type LogisticsFamily } from "@/lib/logistics";

function FamilyDetails({ family }: { family: LogisticsFamily }) {
  return (
    <div className="min-w-0 flex-1">
      <Link href={`/admin/logistics?family=${family.id}#family-${family.id}`} className="break-words font-display text-xl hover:text-accent">
        {family.label} <span className="sr-only">— edit logistics</span>
      </Link>
      <p className="mt-1 text-sm text-text-secondary">{family.guests.length} confirmed {family.guests.length === 1 ? "guest" : "guests"} · {family.side === "BRIDE" ? "Bride’s side" : "Groom’s side"}</p>
      <p className="mt-1 break-words text-sm text-text-secondary">{family.guests.map((guest) => guest.name).join(", ")}</p>
      <p className="mt-2 break-words text-sm tabular-nums">{formatArrival(family.logistics?.arrival_date)} · {travelSummary(family.logistics)}</p>
    </div>
  );
}

function StayGroup({ group }: { group: AccommodationGroup }) {
  const [sort, setSort] = useState<"room" | "family" | "arrival">("room");
  const isHotel = group.kind === "HOTEL";
  const ordered = sortAccommodationFamilies(group.families, sort);
  const rooms = new Set(group.families.filter((family) => family.accommodation?.room_number).map((family) => family.accommodation?.id)).size;
  const guestCount = group.families.reduce((sum, family) => sum + family.guests.length, 0);
  return (
    <section className="border-t border-border/60 py-7">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-xs uppercase tracking-[0.1em] text-accent">{isHotel ? "Hotel" : "House"}</p>
          <h2 className="break-words font-display text-3xl">{group.name}</h2>
          <p className="mt-2 text-sm text-text-secondary tabular-nums">
            {group.families.length} {group.families.length === 1 ? "family" : "families"} · {guestCount} confirmed {guestCount === 1 ? "guest" : "guests"}{` · ${rooms} ${rooms === 1 ? "room" : "rooms"} assigned`}
          </p>
        </div>
        <SelectField label={`Sort ${group.name} by`} value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
          <option value="room">Room number</option>
          <option value="family">Family name</option>
          <option value="arrival">Arrival date</option>
        </SelectField>
      </div>
      <ul className="space-y-4">
        {ordered.map((family) => (
          <li key={family.id} className="flex flex-col gap-3 bg-warm-white p-4 sm:flex-row sm:gap-6 sm:p-5">
            <div className="w-24 shrink-0">
              <p className="text-xs uppercase tracking-[0.1em] text-text-secondary">Room</p>
              <p className={`mt-1 break-words ${family.accommodation?.room_number ? "font-display text-2xl tabular-nums" : "text-sm text-text-secondary"}`}>{family.accommodation?.room_number ?? "Not assigned"}</p>
              {family.accommodation?.room_number && group.families.filter((other) => other.accommodation?.id === family.accommodation?.id).length > 1 && (
                <p className="mt-1 text-xs text-sage">Shared room</p>
              )}
            </div>
            <FamilyDetails family={family} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AccommodationWorkspace({ families }: { families: LogisticsFamily[] }) {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("ALL");
  const visible = families.filter((family) => matchesFamily(family, search) &&
    (kind === "ALL" || (kind === "UNASSIGNED" ? !family.accommodation : family.accommodation?.kind === kind)));
  const groups = groupByAccommodation(visible);
  const unassigned = visible.filter((family) => !family.accommodation);
  const totalGroups = groupByAccommodation(families);
  const assigned = families.filter((family) => family.accommodation).length;
  return (
    <>
      <p className="mb-6 text-sm text-text-secondary tabular-nums">
        {totalGroups.filter((group) => group.kind === "HOTEL").length} hotels · {totalGroups.filter((group) => group.kind === "HOUSE").length} houses · {assigned} {assigned === 1 ? "family" : "families"} assigned
      </p>
      <div className="mb-8 grid gap-4 sm:grid-cols-[2fr_1fr]">
        <FormField label="Search accommodation or guests" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Hotel, house, room or guest name…" />
        <SelectField label="Show" value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="ALL">All accommodation</option>
          <option value="HOTEL">Hotels</option>
          <option value="HOUSE">Houses</option>
          <option value="UNASSIGNED">Awaiting accommodation</option>
        </SelectField>
      </div>
      {groups.map((group) => <StayGroup key={group.key} group={group} />)}
      {unassigned.length > 0 && (
        <section className="border-t border-border/60 py-7">
          <h2 className="font-display text-3xl">Awaiting accommodation</h2>
          <p className="mt-2 mb-6 text-sm text-text-secondary">Select a family to assign a house or hotel room.</p>
          <ul className="grid gap-5 sm:grid-cols-2">
            {unassigned.map((family) => <li key={family.id} className="bg-warm-white p-5"><FamilyDetails family={family} /></li>)}
          </ul>
        </section>
      )}
      {visible.length === 0 && <p className="py-6 text-text-secondary">{families.length === 0 ? "Confirmed families will appear here when a guest accepts an invitation." : "No families or accommodation match these filters."}</p>}
    </>
  );
}
