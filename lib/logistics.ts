import type { Tables } from "./supabase/database.types";

export const TRAVEL_MODES = ["FLIGHT", "TRAIN", "CAR", "BUS", "OTHER"] as const;
export type TravelMode = (typeof TRAVEL_MODES)[number];
export const TRAVEL_LABELS: Record<TravelMode, string> = {
  FLIGHT: "Flight",
  TRAIN: "Train",
  CAR: "Car",
  BUS: "Bus",
  OTHER: "Other",
};

export type Accommodation = Tables<"accommodations">;
export type FamilyLogistics = Tables<"family_logistics">;
export type LogisticsFamily = {
  id: number;
  label: string;
  side: "BRIDE" | "GROOM";
  guests: { id: number; name: string }[];
  logistics: FamilyLogistics | null;
  accommodation: Accommodation | null;
};

const naturalOrder = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
export const compareNames = (a: string, b: string) => naturalOrder.compare(a, b);

export function accommodationLabel(stay: Accommodation): string {
  return stay.kind === "HOTEL"
    ? `${stay.name} · ${stay.room_number ? `Room ${stay.room_number}` : "Room not assigned"}`
    : `${stay.name} · House`;
}

export function accommodationKey(stay: Pick<Accommodation, "kind" | "name">): string {
  return `${stay.kind}:${stay.name.trim().toLocaleLowerCase()}`;
}

// The picker selects a property. Room assignments remain separate so a hotel
// only needs to be selected once, regardless of how many rooms it has.
export function accommodationOptions(accommodations: Accommodation[]) {
  const properties = new Map<string, Pick<Accommodation, "id" | "kind" | "name">>();
  for (const stay of accommodations) {
    const key = accommodationKey(stay);
    const existing = properties.get(key);
    if (!existing || stay.id < existing.id) {
      properties.set(key, { id: stay.id, kind: stay.kind, name: stay.name });
    }
  }
  return [...properties.values()].sort((a, b) => compareNames(a.name, b.name) || compareNames(a.kind, b.kind));
}

export function formatArrival(value: string | null | undefined): string {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function travelLabel(value: string | null | undefined): string {
  return value && value in TRAVEL_LABELS
    ? TRAVEL_LABELS[value as TravelMode]
    : "Travel not set";
}

export function matchesFamily(family: LogisticsFamily, query: string): boolean {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [family.label, `#${family.id}`, ...family.guests.map((g) => g.name),
    family.accommodation?.name, family.accommodation?.room_number]
    .join(" ").toLocaleLowerCase();
  return words.every((word) => haystack.includes(word));
}

export type AccommodationGroup = {
  key: string;
  name: string;
  kind: string;
  families: LogisticsFamily[];
};

export function groupByAccommodation(families: LogisticsFamily[]): AccommodationGroup[] {
  const groups = new Map<string, AccommodationGroup>();
  for (const family of families) {
    const stay = family.accommodation;
    if (!stay) continue;
    const key = accommodationKey(stay);
    const group = groups.get(key) ?? { key, name: stay.name, kind: stay.kind, families: [] };
    group.families.push(family);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => compareNames(a.name, b.name));
}

export function sortAccommodationFamilies(families: LogisticsFamily[], sort: "room" | "family" | "arrival") {
  return [...families].sort((a, b) => {
    const primary = sort === "room"
      ? Number(!a.accommodation?.room_number) - Number(!b.accommodation?.room_number)
        || compareNames(a.accommodation?.room_number ?? "", b.accommodation?.room_number ?? "")
      : sort === "arrival"
        ? compareNames(a.logistics?.arrival_date ?? "9999", b.logistics?.arrival_date ?? "9999")
        : 0;
    return primary || compareNames(a.label, b.label) || a.id - b.id;
  });
}

// Shared validation keeps malformed dates and invalid accommodation details out
// of server actions; database checks also protect writes made through the API.
export function parseLogisticsForm(form: FormData) {
  const value = (key: string) => String(form.get(key) ?? "").trim();
  const familyId = Number(value("family_id"));
  if (!Number.isSafeInteger(familyId) || familyId <= 0) return { error: "Choose a valid family." } as const;
  const mode = value("travel_mode");
  if (mode && !(TRAVEL_MODES as readonly string[]).includes(mode)) return { error: "Choose a valid travel method." } as const;
  const details = value("travel_details");
  if (details.length > 1000) return { error: "Travel details must be 1,000 characters or fewer." } as const;
  const date = value("arrival_date");
  if (date) {
    const parsed = new Date(`${date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      return { error: "Enter a valid arrival date." } as const;
    }
  }
  const choice = value("accommodation_id");
  const isNew = choice === "new";
  const id = choice && !isNew ? Number(choice) : null;
  if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) return { error: "Choose a valid accommodation." } as const;
  const kind = isNew ? value("new_kind") : "";
  const name = isNew ? value("new_name").replace(/\s+/g, " ") : "";
  const room = (isNew && kind === "HOTEL") || id !== null ? value("room_number") : "";
  if (isNew && kind !== "HOUSE" && kind !== "HOTEL") return { error: "Choose a house or hotel." } as const;
  if (isNew && (!name || name.length > 160)) return { error: "Enter a house or hotel name of up to 160 characters." } as const;
  if (room.length > 40) return { error: "Enter a hotel room number of up to 40 characters." } as const;
  return {
    data: {
      p_family_id: familyId,
      p_travel_mode: mode || null,
      p_travel_details: details || null,
      p_arrival_date: date || null,
      p_accommodation_id: id,
      p_new_kind: kind || null,
      p_new_name: name || null,
      p_new_room_number: room || null,
    },
  } as const;
}
