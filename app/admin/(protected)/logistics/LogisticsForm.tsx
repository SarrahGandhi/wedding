"use client";

import { useId, useRef, useState, useTransition } from "react";
import { Button } from "@/app/shared/Button";
import { FormField, SelectField, TextareaField } from "@/app/shared/FormField";
import { accommodationKey, accommodationOptions, familyArrivals, TRAVEL_MODES, TRAVEL_LABELS, type Accommodation, type ArrivalPlan, type LogisticsFamily } from "@/lib/logistics";
import { saveFamilyLogistics } from "./actions";

export function LogisticsForm({ family, accommodations, pickupNames, onSaved, onCancel }: {
  family: LogisticsFamily;
  accommodations: Accommodation[];
  pickupNames: string[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const properties = accommodationOptions(accommodations);
  const initialKey = family.accommodation ? accommodationKey(family.accommodation) : null;
  const initialProperty = properties.find((property) => accommodationKey(property) === initialKey);
  const [choice, setChoice] = useState(String(initialProperty?.id ?? ""));
  const [kind, setKind] = useState("HOUSE");
  const [name, setName] = useState("");
  const [room, setRoom] = useState(family.accommodation?.room_number ?? "");
  const [travelMode, setTravelMode] = useState(family.logistics?.travel_mode ?? "");
  const [trainNumber, setTrainNumber] = useState(family.logistics?.train_number ?? "");
  const [coachNumber, setCoachNumber] = useState(family.logistics?.coach_number ?? "");
  const [flightNumber, setFlightNumber] = useState(family.logistics?.flight_number ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [arrivals, setArrivals] = useState(() => {
    const saved = familyArrivals(family.logistics);
    return (saved.length ? saved : [emptyArrival()]).map((entry, id) => ({ ...entry, id }));
  });
  const nextArrivalId = useRef(arrivals.length);
  const inputId = useId();
  const isNew = choice === "new";
  const selectedProperty = properties.find((property) => String(property.id) === choice);
  const propertyKind = isNew ? kind : selectedProperty?.kind;
  const propertyName = isNew ? name : selectedProperty?.name ?? "";
  const hotelNames = properties.filter((property) => property.kind === "HOTEL").map((property) => property.name);
  const existingRooms = accommodations.filter((stay) => stay.kind === propertyKind && stay.room_number && stay.name.trim().toLocaleLowerCase() === propertyName.trim().toLocaleLowerCase());

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("arrivals", JSON.stringify(arrivals.map((entry) => Object.fromEntries(
      ["guests", "arrival_date", "arrival_time", "travel_mode", "travel_details", "pickup_by"].map((field) =>
        [field, form.get(`arrival-${entry.id}-${field}`) || null])
    ))));
    setError(null);
    startTransition(async () => {
      try {
        const result = await saveFamilyLogistics(form);
        if (result.error) setError(result.error);
        else onSaved();
      } catch {
        setError("The details could not be saved. Please try again.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="mt-5 bg-warm-white p-4 sm:p-6" aria-label={`Logistics for ${family.label}`}>
      <input type="hidden" name="family_id" value={family.id} />
      <fieldset disabled={pending} className="min-w-0 space-y-6">
        <legend className="mb-4 font-display text-xl">Travel and arrival</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Travelling by" name="travel_mode" value={travelMode} onChange={(event) => setTravelMode(event.target.value)}>
            <option value="">Not decided yet</option>
            {TRAVEL_MODES.map((mode) => <option key={mode} value={mode}>{TRAVEL_LABELS[mode]}</option>)}
          </SelectField>
          <FormField label="Arrival date" type="date" name="arrival_date" defaultValue={family.logistics?.arrival_date ?? ""} />
        </div>
        {travelMode === "TRAIN" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Train number" name="train_number" maxLength={40} value={trainNumber}
              onChange={(event) => setTrainNumber(event.target.value)} placeholder="e.g. 12952" />
            <FormField label="Coach number" name="coach_number" maxLength={40} value={coachNumber}
              onChange={(event) => setCoachNumber(event.target.value)} placeholder="e.g. B2" />
          </div>
        )}
        {travelMode === "FLIGHT" && (
          <div className="sm:max-w-sm">
            <FormField label="Flight number" name="flight_number" maxLength={40} value={flightNumber}
              onChange={(event) => setFlightNumber(event.target.value)} placeholder="e.g. AI 101" />
          </div>
        )}
        <TextareaField label="Travel details (optional)" name="travel_details" rows={2} maxLength={1000}
          defaultValue={family.logistics?.travel_details ?? ""} placeholder="Arrival time or pickup arrangements" />
        <legend className="mb-4 font-display text-xl">Arrivals and pickups</legend>
        <p className="text-sm text-text-secondary">Add a pickup for each group arriving together. All details are optional.</p>
        {arrivals.map((entry, index) => <fieldset key={entry.id} className="min-w-0 space-y-4 rounded-xl border border-border/60 p-4">
          <legend className="px-2 font-medium">Pickup {index + 1}</legend>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Guests arriving (optional)" name={`arrival-${entry.id}-guests`} maxLength={300}
              defaultValue={entry.guests ?? ""} list={`${inputId}-guests`} placeholder="Whole family, or names arriving together" />
            <fieldset className="min-w-0">
              <legend className="text-sm text-text-secondary">Arrival date and time (IST)</legend>
              <div className="mt-2 grid min-w-0 gap-3 sm:grid-cols-2">
                <FormField label="Date" type="date" name={`arrival-${entry.id}-arrival_date`} min="0001-01-01" max="9999-12-31"
                  defaultValue={entry.arrival_date ?? ""} labelClassName="min-w-0" className="min-w-0" />
                <FormField label="Time (optional)" type="time" step={60} name={`arrival-${entry.id}-arrival_time`}
                  defaultValue={entry.arrival_time ?? ""} labelClassName="min-w-0" className="min-w-0" />
              </div>
            </fieldset>
            <SelectField label="Travelling by" name={`arrival-${entry.id}-travel_mode`} defaultValue={entry.travel_mode ?? ""}>
              <option value="">Not decided yet</option>
              {TRAVEL_MODES.map((mode) => <option key={mode} value={mode}>{TRAVEL_LABELS[mode]}</option>)}
            </SelectField>
            <FormField label="To be picked up by (optional)" name={`arrival-${entry.id}-pickup_by`} maxLength={160}
              defaultValue={entry.pickup_by ?? ""} list={`${inputId}-pickup`}
              placeholder="Enter or choose a name" />
          </div>
          <TextareaField label="Travel details (optional)" name={`arrival-${entry.id}-travel_details`} rows={2} maxLength={1000}
            defaultValue={entry.travel_details ?? ""} placeholder="Flight or train number, arrival time, or pickup arrangements" />
          <Button variant="ghost" aria-label={`Remove pickup ${index + 1}`} onClick={() => setArrivals((current) => current.filter((plan) => plan.id !== entry.id))}>Remove pickup</Button>
        </fieldset>)}
        <datalist id={`${inputId}-pickup`}>{pickupNames.map((person) => <option key={person} value={person} />)}</datalist>
        <datalist id={`${inputId}-guests`}>{family.guests.map((guest) => <option key={guest.id} value={guest.name} />)}</datalist>
        <Button variant="secondary" disabled={arrivals.length >= 50} onClick={() => {
          const id = nextArrivalId.current++;
          setArrivals((current) => [...current, { ...emptyArrival(), id }]);
        }}>Add another pickup</Button>

        <div className="space-y-4 border-t border-border/60 pt-5">
          <h3 className="font-display text-xl">Where they’re staying</h3>
          <SelectField label="Accommodation" name="accommodation_id" value={choice} onChange={(event) => { setChoice(event.target.value); setRoom(""); }}>
            <option value="">Not assigned yet</option>
            <option value="new">+ Add accommodation</option>
            {properties.length > 0 && (
              <optgroup label="Existing accommodation">
                {properties.map((property) => <option key={property.id} value={property.id}>{property.name} · {property.kind === "HOTEL" ? "Hotel" : "House"}</option>)}
              </optgroup>
            )}
          </SelectField>
          <p className="text-sm leading-relaxed text-text-secondary">
            Choose a hotel or house, then enter the family’s room number if known.
          </p>
          {isNew && (
            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField label="Stay type" name="new_kind" value={kind} onChange={(event) => { setKind(event.target.value); setName(""); setRoom(""); }}>
                <option value="HOUSE">House</option>
                <option value="HOTEL">Hotel</option>
              </SelectField>
              <FormField label={kind === "HOTEL" ? "Hotel name" : "House name"} name="new_name" required maxLength={160}
                value={name} onChange={(event) => { setName(event.target.value); setRoom(""); }}
                list={kind === "HOTEL" ? `${inputId}-hotels` : undefined}
                placeholder={kind === "HOTEL" ? "Hotel name" : "e.g. Gandhi house"} />
              {kind === "HOTEL" && (
                <datalist id={`${inputId}-hotels`}>
                  {hotelNames.map((hotel) => <option key={hotel} value={hotel} />)}
                </datalist>
              )}
            </div>
          )}
          {(isNew || selectedProperty) && (
            <div className="space-y-2 sm:max-w-sm">
              <FormField label="Room number (optional)" name="room_number" maxLength={40}
                value={room} onChange={(event) => setRoom(event.target.value)} list={`${inputId}-rooms`} placeholder="e.g. 201 or 12A" />
              <datalist id={`${inputId}-rooms`}>
                {existingRooms.map((stay) => <option key={stay.id} value={stay.room_number ?? ""} />)}
              </datalist>
              <p className="text-sm text-text-secondary">Use the same room number for families sharing a room.</p>
            </div>
          )}
        </div>
        {error && <p role="alert" className="text-sm text-rose">{error}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" pending={pending}>{pending ? "Saving…" : "Save logistics"}</Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </fieldset>
    </form>
  );
}

function emptyArrival(): ArrivalPlan {
  return { guests: null, arrival_date: null, travel_mode: null, travel_details: null, pickup_by: null };
}
