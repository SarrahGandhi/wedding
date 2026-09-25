"use client";

import { useId, useState, useTransition } from "react";
import { Button } from "@/app/shared/Button";
import { FormField, SelectField, TextareaField } from "@/app/shared/FormField";
import { compareNames, filterLogisticsFamilies, formatArrival, sortLogisticsFamilies, travelLabel, TRAVEL_LABELS, TRAVEL_MODES, type LogisticsFamily, type LogisticsSideFilter } from "@/lib/logistics";
import { saveFamilyDeparture } from "./actions";

function DepartureForm({ family, names, onSaved, onCancel }: {
  family: LogisticsFamily; names: string[]; onSaved: () => void; onCancel: () => void;
}) {
  const listId = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form className="mt-5 bg-warm-white p-4 sm:p-6" aria-label={`Departure for ${family.label}`} onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setError(null);
      startTransition(async () => {
        try {
          const result = await saveFamilyDeparture(form);
          if (result.error) setError(result.error);
          else onSaved();
        } catch {
          setError("The departure details could not be saved. Please try again.");
        }
      });
    }}>
      <input type="hidden" name="family_id" value={family.id} />
      <fieldset disabled={pending} className="min-w-0 space-y-6">
        <legend className="mb-4 font-display text-xl">Departure details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Departing by" name="departure_mode" defaultValue={family.logistics?.departure_mode ?? ""}>
            <option value="">Not decided yet</option>
            {TRAVEL_MODES.map((mode) => <option key={mode} value={mode}>{TRAVEL_LABELS[mode]}</option>)}
          </SelectField>
          <FormField label="Departure date" type="date" name="departure_date" min="0001-01-01" max="9999-12-31"
            defaultValue={family.logistics?.departure_date ?? ""} />
          <FormField label="To be dropped by (optional)" name="dropoff_by" maxLength={160}
            defaultValue={family.logistics?.dropoff_by ?? ""} list={listId} placeholder="Enter or choose a name" />
          <datalist id={listId}>{names.map((name) => <option key={name} value={name} />)}</datalist>
        </div>
        <TextareaField label="Departure details (optional)" name="departure_details" rows={3} maxLength={1000}
          defaultValue={family.logistics?.departure_details ?? ""}
          placeholder="Flight or train number, departure time, destination, or drop-off arrangements" />
        {error && <p role="alert" className="text-sm text-rose">{error}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" pending={pending}>{pending ? "Saving…" : "Save departure"}</Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </fieldset>
    </form>
  );
}

function DepartureRow({ family, names }: { family: LogisticsFamily; names: string[] }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const details = family.logistics;
  const hasDeparture = details && (details.departure_mode || details.departure_date || details.departure_details || details.dropoff_by);
  return (
    <article className="border-t border-border/60 py-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-words font-display text-2xl leading-tight">{family.label}</h2>
          <p className="mt-2 text-sm text-text-secondary">
            <span className="tabular-nums">#{family.id}</span> · {family.side === "BRIDE" ? "Bride’s side" : "Groom’s side"} · {family.guests.length} confirmed {family.guests.length === 1 ? "guest" : "guests"}
          </p>
        </div>
        <Button variant="secondary" className="shrink-0" aria-expanded={editing} aria-controls={`departure-form-${family.id}`}
          onClick={() => { setSaved(false); setEditing(!editing); }}>
          {editing ? "Close" : hasDeparture ? "Edit" : "Add details"}
        </Button>
      </div>
      <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
        <div><dt className="mb-1 text-text-secondary">Departing by</dt><dd>{travelLabel(details?.departure_mode)}</dd></div>
        <div><dt className="mb-1 text-text-secondary">Departing</dt><dd className="tabular-nums">{formatArrival(details?.departure_date)}</dd></div>
        <div><dt className="mb-1 text-text-secondary">To be dropped by</dt><dd className="break-words">{details?.dropoff_by || "Not assigned yet"}</dd></div>
      </dl>
      {details?.departure_details && <p className="mt-4 whitespace-pre-wrap break-words text-sm text-text-secondary">{details.departure_details}</p>}
      {saved && <p role="status" className="mt-3 text-sm text-sage">Departure saved.</p>}
      <div id={`departure-form-${family.id}`}>
        {editing && <DepartureForm family={family} names={names}
          onSaved={() => { setEditing(false); setSaved(true); }} onCancel={() => setEditing(false)} />}
      </div>
    </article>
  );
}

export function DepartureWorkspace({ families, initialFamilyId }: { families: LogisticsFamily[]; initialFamilyId: number | null }) {
  const [search, setSearch] = useState(initialFamilyId ? `#${initialFamilyId}` : "");
  const [filter, setFilter] = useState("ALL");
  const [side, setSide] = useState<LogisticsSideFilter>("ALL");
  const [sort, setSort] = useState<"family" | "departure" | "dropoff">("family");
  const eligible = filterLogisticsFamilies(families, { required: "REQUIRED" });
  const names = [...new Set(eligible.flatMap((family) => family.logistics?.dropoff_by ? [family.logistics.dropoff_by] : []))].sort(compareNames);
  const planned = eligible.filter((family) => family.logistics?.departure_mode && family.logistics?.departure_date).length;
  const visible = sortLogisticsFamilies(filterLogisticsFamilies(eligible, { search, side }).filter((family) => {
    if (filter === "TRAVEL") return !family.logistics?.departure_mode || !family.logistics?.departure_date;
    if (filter === "UNASSIGNED") return !family.logistics?.dropoff_by;
    return true;
  }), sort);

  if (families.length === 0) return <p className="py-6 text-text-secondary">Confirmed families will appear here when a guest accepts an invitation.</p>;
  if (eligible.length === 0) return <p className="py-6 text-text-secondary">No families require pickup and accommodation. Check that option in Arrival to include a family here.</p>;
  return <>
    <p className="mb-6 text-sm text-text-secondary tabular-nums">
      {eligible.length} {eligible.length === 1 ? "family" : "families"} requiring arrangements · {planned} with departure date and travel method · {eligible.length - planned} with departure details incomplete
    </p>
    <div className="mb-8 grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
      <FormField label="Search families or stays" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Guest name, family #, hotel or house…" />
      <SelectField label="Side" value={side} onChange={(event) => setSide(event.target.value as LogisticsSideFilter)}>
        <option value="ALL">Both sides</option>
        <option value="BRIDE">Bride’s side</option>
        <option value="GROOM">Groom’s side</option>
      </SelectField>
      <SelectField label="Show" value={filter} onChange={(event) => setFilter(event.target.value)}>
        <option value="ALL">All requiring arrangements</option>
        <option value="TRAVEL">Departure details incomplete</option>
        <option value="UNASSIGNED">Drop-off person not assigned</option>
      </SelectField>
      <SelectField label="Sort by" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
        <option value="family">Family name</option>
        <option value="departure">Departure date</option>
        <option value="dropoff">To be dropped by (A–Z)</option>
      </SelectField>
    </div>
    {visible.length === 0 ? <p className="py-6 text-text-secondary">No families match these filters.</p>
      : visible.map((family) => <DepartureRow key={family.id} family={family} names={names} />)}
  </>;
}
