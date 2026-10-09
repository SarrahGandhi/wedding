"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useAdminSide } from "../AdminSideProvider";
import { Button } from "@/app/shared/Button";
import { FormField, SelectField, TextareaField } from "@/app/shared/FormField";
import { compareNames, familyDepartures, departureSortKey, type DeparturePlan, filterLogisticsFamilies, formatArrival, sortLogisticsFamilies, travelLabel, TRAVEL_LABELS, TRAVEL_MODES, type LogisticsFamily } from "@/lib/logistics";
import { saveFamilyDeparture } from "./actions";

function DepartureForm({ family, names, onSaved, onCancel }: {
  family: LogisticsFamily; names: string[]; onSaved: () => void; onCancel: () => void;
}) {
  const listId = useId();
  const [departures, setDepartures] = useState(() => {
    const saved = familyDepartures(family.logistics);
    return (saved.length ? saved : [emptyDeparture()]).map((entry, id) => ({ ...entry, id }));
  });
  const nextId = useRef(departures.length);
  function update(id: number, field: keyof DeparturePlan, value: string) {
    setDepartures((current) => current.map((entry) => entry.id === id ? { ...entry, [field]: value || null } : entry));
  }
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form className="mt-5 bg-warm-white p-4 sm:p-6" aria-label={`Departure for ${family.label}`} onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      form.set("departures", JSON.stringify(departures));
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
        <legend className="mb-4 font-display text-xl">Departures and drop-offs</legend>
        <p className="text-sm text-text-secondary">Add a departure for each group leaving together. All details are optional.</p>
        {departures.map((entry, index) => <fieldset key={entry.id} className="min-w-0 space-y-4 rounded-xl border border-border/60 p-4">
          <legend className="px-2 font-medium">Departure {index + 1}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Guests departing (optional)" maxLength={300} value={entry.guests ?? ""}
              onChange={(event) => update(entry.id, "guests", event.target.value)} list={`${listId}-guests`} placeholder="Whole family, or names leaving together" />
            <fieldset className="min-w-0">
              <legend className="text-sm text-text-secondary">Departure date and time (IST)</legend>
              <div className="mt-2 grid min-w-0 gap-3 sm:grid-cols-2">
                <FormField label="Date" type="date" min="0001-01-01" max="9999-12-31" value={entry.departure_date ?? ""}
                  onChange={(event) => update(entry.id, "departure_date", event.target.value)} labelClassName="min-w-0" className="min-w-0" />
                <FormField label="Time (optional)" type="time" step={60} value={entry.departure_time ?? ""}
                  onChange={(event) => update(entry.id, "departure_time", event.target.value)} labelClassName="min-w-0" className="min-w-0" />
              </div>
            </fieldset>
            <SelectField label="Departing by" value={entry.departure_mode ?? ""} onChange={(event) => update(entry.id, "departure_mode", event.target.value)}>
              <option value="">Not decided yet</option>
              {TRAVEL_MODES.map((mode) => <option key={mode} value={mode}>{TRAVEL_LABELS[mode]}</option>)}
            </SelectField>
            <FormField label="To be dropped by (optional)" maxLength={160} value={entry.dropoff_by ?? ""}
              onChange={(event) => update(entry.id, "dropoff_by", event.target.value)} list={listId} placeholder="Enter or choose a name" />
            {entry.departure_mode === "FLIGHT" && <FormField label="Flight number (optional)" maxLength={40} value={entry.flight_number ?? ""}
              onChange={(event) => update(entry.id, "flight_number", event.target.value)} placeholder="e.g. AI 101" />}
            {entry.departure_mode === "TRAIN" && <>
              <FormField label="Train number (optional)" maxLength={40} value={entry.train_number ?? ""}
                onChange={(event) => update(entry.id, "train_number", event.target.value)} placeholder="e.g. 12952" />
              <FormField label="Departure station (optional)" maxLength={160} value={entry.station ?? ""}
                onChange={(event) => update(entry.id, "station", event.target.value)} placeholder="Station name" />
            </>}
            {entry.departure_mode === "BUS" && <FormField label="Bus departure location (optional)" maxLength={160} value={entry.bus_location ?? ""}
              onChange={(event) => update(entry.id, "bus_location", event.target.value)} placeholder="Bus stand or boarding point" />}
          </div>
          <TextareaField label="Departure details (optional)" rows={2} maxLength={1000} value={entry.departure_details ?? ""}
            onChange={(event) => update(entry.id, "departure_details", event.target.value)} placeholder="Destination, terminal, or drop-off arrangements" />
          <Button variant="ghost" aria-label={`Remove departure ${index + 1}`} onClick={() => setDepartures((current) => current.filter((plan) => plan.id !== entry.id))}>Remove departure</Button>
        </fieldset>)}
        <datalist id={listId}>{names.map((name) => <option key={name} value={name} />)}</datalist>
        <datalist id={`${listId}-guests`}>{family.guests.map((guest) => <option key={guest.id} value={guest.name} />)}</datalist>
        <Button variant="secondary" disabled={departures.length >= 50} onClick={() => {
          const id = nextId.current++;
          setDepartures((current) => [...current, { ...emptyDeparture(), id }]);
        }}>Add another departure</Button>
        {error && <p role="alert" className="text-sm text-rose">{error}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" pending={pending}>{pending ? "Saving…" : "Save departures"}</Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </fieldset>
    </form>
  );
}

function DepartureRow({ family, names }: { family: LogisticsFamily; names: string[] }) {
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const departures = familyDepartures(family.logistics).sort((a, b) => compareNames(departureSortKey(a), departureSortKey(b)));
  const hasDeparture = departures.length > 0;
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
      {departures.length === 0 ? <p className="mt-5 text-sm text-text-secondary">No departures added yet.</p> : (
        <ol className="mt-5 space-y-4">
          {departures.map((entry, index) => <li key={index} className="rounded-xl bg-warm-white p-4">
            <h3 className="break-words text-base font-medium">Departure {index + 1} · {entry.guests || "Whole family"}</h3>
            <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-3">
              <div><dt className="mb-1 text-text-secondary">Departing by</dt><dd>{travelLabel(entry.departure_mode)}{entry.departure_mode === "TRAIN" && entry.train_number ? ` · ${entry.train_number}` : entry.departure_mode === "FLIGHT" && entry.flight_number ? ` · ${entry.flight_number}` : ""}</dd></div>
              <div><dt className="mb-1 text-text-secondary">Departing</dt><dd className="tabular-nums">{formatArrival(entry.departure_date)} · {entry.departure_time ? `${entry.departure_time} IST` : "Time not set"}</dd></div>
              <div><dt className="mb-1 text-text-secondary">To be dropped by</dt><dd className="break-words">{entry.dropoff_by || "Not assigned yet"}</dd></div>
              {entry.departure_mode === "TRAIN" && <div><dt className="mb-1 text-text-secondary">Departure station</dt><dd className="break-words">{entry.station || "Not set"}</dd></div>}
              {entry.departure_mode === "BUS" && <div><dt className="mb-1 text-text-secondary">Bus departure location</dt><dd className="break-words">{entry.bus_location || "Not set"}</dd></div>}
            </dl>
            {entry.departure_details && <p className="mt-4 whitespace-pre-wrap break-words text-sm text-text-secondary">{entry.departure_details}</p>}
          </li>)}
        </ol>
      )}
      {saved && <p role="status" className="mt-3 text-sm text-sage">Departures saved.</p>}
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
  const { side } = useAdminSide();
  const [sort, setSort] = useState<"family" | "departure" | "dropoff">("family");
  const eligible = filterLogisticsFamilies(families, { required: "REQUIRED", side });
  const names = [...new Set(eligible.flatMap((family) => familyDepartures(family.logistics).flatMap((entry) => entry.dropoff_by ? [entry.dropoff_by] : [])))].sort(compareNames);
  const planned = eligible.filter((family) => {
    const entries = familyDepartures(family.logistics);
    return entries.length > 0 && entries.every((entry) => entry.departure_mode && entry.departure_date && entry.departure_time);
  }).length;
  const visible = sortLogisticsFamilies(filterLogisticsFamilies(eligible, { search, side }).filter((family) => {
    const entries = familyDepartures(family.logistics);
    if (filter === "TRAVEL") return entries.length === 0 || entries.some((entry) => !entry.departure_mode || !entry.departure_date || !entry.departure_time);
    if (filter === "UNASSIGNED") return entries.length === 0 || entries.some((entry) => !entry.dropoff_by);
    return true;
  }), sort);

  if (families.length === 0) return <p className="py-6 text-text-secondary">Confirmed families will appear here when a guest accepts an invitation.</p>;
  if (eligible.length === 0) return <p className="py-6 text-text-secondary">No families on the selected side require pickup and accommodation. Check that option in Arrival to include a family here.</p>;
  return <>
    <p className="mb-6 text-sm text-text-secondary tabular-nums">
      {eligible.length} {eligible.length === 1 ? "family" : "families"} requiring arrangements · {planned} with dates, times, and travel methods for all departures · {eligible.length - planned} with departure details incomplete
    </p>
    <div className="mb-8 grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr]">
      <FormField label="Search families or stays" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Guest name, family #, hotel or house…" />
      <SelectField label="Show" value={filter} onChange={(event) => setFilter(event.target.value)}>
        <option value="ALL">All requiring arrangements</option>
        <option value="TRAVEL">Departure details incomplete</option>
        <option value="UNASSIGNED">Drop-off person not assigned</option>
      </SelectField>
      <SelectField label="Sort by" value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}>
        <option value="family">Family name</option>
        <option value="departure">Departure date and time</option>
        <option value="dropoff">To be dropped by (A–Z)</option>
      </SelectField>
    </div>
    {visible.length === 0 ? <p className="py-6 text-text-secondary">No families match these filters.</p>
      : visible.map((family) => <DepartureRow key={family.id} family={family} names={names} />)}
  </>;
}

function emptyDeparture(): DeparturePlan {
  return { guests: null, departure_date: null, departure_time: null, departure_mode: null,
    train_number: null, flight_number: null, station: null, bus_location: null,
    departure_details: null, dropoff_by: null };
}
