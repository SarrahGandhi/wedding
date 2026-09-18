"use client";

import { useId, useState, useTransition } from "react";
import { Button } from "@/app/shared/Button";
import { FormField, SelectField, TextareaField } from "@/app/shared/FormField";
import { accommodationKey, accommodationOptions, TRAVEL_MODES, TRAVEL_LABELS, type Accommodation, type LogisticsFamily } from "@/lib/logistics";
import { saveFamilyLogistics } from "./actions";

export function LogisticsForm({ family, accommodations, onSaved, onCancel }: {
  family: LogisticsFamily;
  accommodations: Accommodation[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const properties = accommodationOptions(accommodations);
  const initialProperty = family.accommodation
    ? properties.find((property) => accommodationKey(property) === accommodationKey(family.accommodation!))
    : null;
  const [choice, setChoice] = useState(String(initialProperty?.id ?? ""));
  const [kind, setKind] = useState("HOUSE");
  const [name, setName] = useState("");
  const [room, setRoom] = useState(family.accommodation?.room_number ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputId = useId();
  const isNew = choice === "new";
  const selectedProperty = properties.find((property) => String(property.id) === choice);
  const isHotel = isNew ? kind === "HOTEL" : selectedProperty?.kind === "HOTEL";
  const hotelName = isNew ? name : selectedProperty?.name ?? "";
  const hotelNames = properties.filter((property) => property.kind === "HOTEL").map((property) => property.name);
  const existingRooms = accommodations.filter((stay) => stay.kind === "HOTEL" && stay.room_number && stay.name.trim().toLocaleLowerCase() === hotelName.trim().toLocaleLowerCase());

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
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
          <SelectField label="Travelling by" name="travel_mode" defaultValue={family.logistics?.travel_mode ?? ""}>
            <option value="">Not decided yet</option>
            {TRAVEL_MODES.map((mode) => <option key={mode} value={mode}>{TRAVEL_LABELS[mode]}</option>)}
          </SelectField>
          <FormField label="Arrival date" type="date" name="arrival_date" defaultValue={family.logistics?.arrival_date ?? ""} />
        </div>
        <TextareaField label="Travel details (optional)" name="travel_details" rows={2} maxLength={1000}
          defaultValue={family.logistics?.travel_details ?? ""} placeholder="Flight or train number, arrival time, or pickup arrangements" />

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
                <>
                  <datalist id={`${inputId}-hotels`}>
                    {hotelNames.map((hotel) => <option key={hotel} value={hotel} />)}
                  </datalist>
                </>
              )}
            </div>
          )}
          {isHotel && (
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
