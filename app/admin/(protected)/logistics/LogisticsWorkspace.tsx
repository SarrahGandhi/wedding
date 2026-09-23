"use client";

import { useState } from "react";
import { Button } from "@/app/shared/Button";
import { FormField, SelectField } from "@/app/shared/FormField";
import { accommodationLabel, compareNames, familyArrivals, formatArrival, matchesFamily, sortLogisticsFamilies, travelLabel, type Accommodation, type LogisticsFamily, type LogisticsSort } from "@/lib/logistics";
import { LogisticsForm } from "./LogisticsForm";
import { DepartureWorkspace } from "./DepartureWorkspace";

function FamilyRow({ family, accommodations, pickupNames, initiallyOpen }: {
  family: LogisticsFamily; accommodations: Accommodation[]; pickupNames: string[]; initiallyOpen: boolean;
}) {
  const [editing, setEditing] = useState(initiallyOpen);
  const [saved, setSaved] = useState(false);
  const arrivals = familyArrivals(family.logistics).sort((a, b) => compareNames(a.arrival_date ?? "9999", b.arrival_date ?? "9999"));
  return (
    <article id={`family-${family.id}`} className="border-t border-border/60 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-words font-display text-2xl leading-tight">{family.label}</h2>
          <p className="mt-2 text-sm text-text-secondary">
            <span className="tabular-nums">#{family.id}</span> · {family.side === "BRIDE" ? "Bride’s side" : "Groom’s side"} · {family.guests.length} confirmed {family.guests.length === 1 ? "guest" : "guests"}
          </p>
        </div>
        <Button variant="secondary" className="shrink-0" aria-expanded={editing} aria-controls={`logistics-form-${family.id}`}
          onClick={() => { setSaved(false); setEditing(!editing); }}>
          {editing ? "Close" : family.logistics ? "Edit" : "Add details"}
        </Button>
      </div>
      <dl className="mt-5 text-sm">
        <dt className="mb-1 text-text-secondary">Accommodation</dt><dd className="break-words">{family.accommodation ? accommodationLabel(family.accommodation) : "Not assigned yet"}</dd>
      </dl>
      {arrivals.length === 0 ? <p className="mt-5 text-sm text-text-secondary">No arrivals planned yet.</p> : <ul className="mt-5 space-y-4" aria-label={`Pickups for ${family.label}`}>
        {arrivals.map((entry, index) => <li key={index} className="rounded-xl border border-border/60 p-4">
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div><dt className="mb-1 text-text-secondary">Guests arriving</dt><dd className="break-words">{entry.guests || "Whole family"}</dd></div>
            <div><dt className="mb-1 text-text-secondary">Arriving</dt><dd className="tabular-nums">{formatArrival(entry.arrival_date)}</dd></div>
            <div><dt className="mb-1 text-text-secondary">Travelling by</dt><dd>{travelLabel(entry.travel_mode)}</dd></div>
            <div><dt className="mb-1 text-text-secondary">To be picked up by</dt><dd className="break-words">{entry.pickup_by || "Not assigned yet"}</dd></div>
          </dl>
          {entry.travel_details && <p className="mt-4 whitespace-pre-wrap break-words text-sm text-text-secondary">{entry.travel_details}</p>}
        </li>)}
      </ul>}
      {saved && <p role="status" className="mt-3 text-sm text-sage">Logistics saved.</p>}
      <div id={`logistics-form-${family.id}`}>
        {editing && <LogisticsForm family={family} accommodations={accommodations} pickupNames={pickupNames}
          onSaved={() => { setEditing(false); setSaved(true); }} onCancel={() => setEditing(false)} />}
      </div>
    </article>
  );
}

function ArrivalWorkspace({ families, accommodations, initialFamilyId }: {
  families: LogisticsFamily[]; accommodations: Accommodation[]; initialFamilyId: number | null;
}) {
  const [search, setSearch] = useState(initialFamilyId ? `#${initialFamilyId}` : "");
  const [filter, setFilter] = useState("ALL");
  const [sort, setSort] = useState<Extract<LogisticsSort, "family" | "arrival" | "pickup">>("family");
  const pickupNames = [...new Set(families.flatMap((family) => familyArrivals(family.logistics).flatMap((entry) => entry.pickup_by ? [entry.pickup_by] : [])))].sort(compareNames);
  const assigned = families.filter((family) => family.accommodation).length;
  const visible = sortLogisticsFamilies(families.filter((family) => {
    const exactId = /^#(\d+)$/.exec(search.trim());
    if (exactId ? family.id !== Number(exactId[1]) : !matchesFamily(family, search)) return false;
    if (filter === "UNASSIGNED") return !family.accommodation;
    if (filter === "TRAVEL") {
      const arrivals = familyArrivals(family.logistics);
      return arrivals.length === 0 || arrivals.some((entry) => !entry.travel_mode || !entry.arrival_date);
    }
    if (filter === "BRIDE" || filter === "GROOM") return family.side === filter;
    return true;
  }), sort);

  if (families.length === 0) return <p className="py-6 text-text-secondary">Confirmed families will appear here when a guest accepts an invitation.</p>;

  return (
    <>
      <p className="mb-6 text-sm text-text-secondary tabular-nums">
        {families.length} confirmed {families.length === 1 ? "family" : "families"} · {assigned} with accommodation · {families.length - assigned} awaiting accommodation
      </p>
      <div className="mb-8 grid items-end gap-4 sm:grid-cols-[2fr_1fr_1fr]">
        <FormField label="Search families or stays" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Guest name, family #, hotel or house…" />
        <SelectField label="Show" value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="ALL">All confirmed families</option>
          <option value="UNASSIGNED">Awaiting accommodation</option>
          <option value="TRAVEL">Travel details incomplete</option>
          <option value="BRIDE">Bride’s side</option>
          <option value="GROOM">Groom’s side</option>
        </SelectField>
        <SelectField label="Sort by" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
          <option value="family">Family name</option>
          <option value="arrival">Earliest arrival date</option>
          <option value="pickup">To be picked up by (A–Z)</option>
        </SelectField>
      </div>
      {visible.length === 0 ? <p className="py-6 text-text-secondary">No families match these filters.</p> : visible.map((family) => (
        <FamilyRow key={family.id} family={family} accommodations={accommodations} pickupNames={pickupNames} initiallyOpen={family.id === initialFamilyId} />
      ))}
    </>
  );
}

export function LogisticsWorkspace(props: {
  families: LogisticsFamily[]; accommodations: Accommodation[]; initialFamilyId: number | null;
}) {
  const [tab, setTab] = useState<"arrival" | "departure">("arrival");
  return <>
    <div className="mb-7 inline-flex flex-wrap gap-1 rounded-2xl border border-border/60 bg-warm-white p-1.5" role="tablist" aria-label="Travel direction">
      {(["arrival", "departure"] as const).map((value) => <button key={value} type="button" role="tab"
        id={`logistics-tab-${value}`} aria-controls={`logistics-panel-${value}`} aria-selected={tab === value}
        tabIndex={tab === value ? 0 : -1} onClick={() => setTab(value)}
        onKeyDown={(event) => {
          if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? "arrival" : event.key === "End" ? "departure" : value === "arrival" ? "departure" : "arrival";
          setTab(next);
          document.getElementById(`logistics-tab-${next}`)?.focus();
        }}
        className={`cursor-pointer rounded-xl px-5 py-3 text-base font-medium transition-colors ${tab === value
          ? "bg-foreground text-warm-white" : "text-text-secondary hover:bg-powder"}`}>
        {value === "arrival" ? "Arrival" : "Departure"}
      </button>)}
    </div>
    <div role="tabpanel" id="logistics-panel-arrival" aria-labelledby="logistics-tab-arrival" hidden={tab !== "arrival"}>
      <ArrivalWorkspace {...props} />
    </div>
    <div role="tabpanel" id="logistics-panel-departure" aria-labelledby="logistics-tab-departure" hidden={tab !== "departure"}>
      <DepartureWorkspace families={props.families} initialFamilyId={props.initialFamilyId} />
    </div>
  </>;
}
