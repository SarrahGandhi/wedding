"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { parseId, parseNullable, parseString } from "@/app/shared/action-helpers";
import { DATE_RE, TIME_RE } from "@/app/shared/event-date-time";
import type { GuestSide, RsvpStatus } from "@/lib/types";

export type EventGuest = {
  id: number;
  name: string;
  side: GuestSide;
  rsvpStatus: RsvpStatus;
};

export async function getEventGuests(
  eventId: number,
): Promise<{ guests: EventGuest[]; error?: never } | { error: string; guests?: never }> {
  const { supabase } = await requireAdmin();
  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return { error: "Invalid event id." };
  }

  const guests: EventGuest[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("event_guests_rsvp")
      .select("rsvp_status, guest:guests!inner(id, name, family:guest_families!inner(side))")
      .eq("event_id", eventId)
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1);

    if (error) return { error: "Unable to load the guest list. Please try again." };
    guests.push(
      ...data.map(({ guest, rsvp_status }) => ({
        id: guest.id,
        name: guest.name,
        side: guest.family.side,
        rsvpStatus: rsvp_status,
      })),
    );
    if (data.length < pageSize) break;
  }

  guests.sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id);
  return { guests };
}

export async function createEvent(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const name = parseString(formData.get("name"));
  const date = parseString(formData.get("date"));
  const time = parseString(formData.get("time"));
  const location = parseNullable(formData.get("location"));
  const dress_code = parseNullable(formData.get("dress_code"));
  const details = parseNullable(formData.get("details"));

  if (!name) throw new Error("Name is required.");
  if (!DATE_RE.test(date)) {
    throw new Error("Date must be YYYY-MM-DD.");
  }
  if (!TIME_RE.test(time)) {
    throw new Error("Time must be HH:mm.");
  }

  const { error } = await supabase
    .from("events")
    .insert({ name, date, time, location, dress_code, details });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/events");
  revalidatePath("/admin/rsvp");
}

export async function updateEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = parseId(formData.get("id"));
  const name = parseString(formData.get("name"));
  const date = parseString(formData.get("date"));
  const time = parseString(formData.get("time"));
  const location = parseNullable(formData.get("location"));
  const dress_code = parseNullable(formData.get("dress_code"));
  const details = parseNullable(formData.get("details"));

  if (id === null) return { error: "Invalid id." };
  if (!name) return { error: "Name is required." };
  if (!DATE_RE.test(date)) {
    return { error: "Date must be YYYY-MM-DD." };
  }
  if (!TIME_RE.test(time)) {
    return { error: "Time must be HH:mm." };
  }

  const { error } = await supabase
    .from("events")
    .update({ name, date, time, location, dress_code, details })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  revalidatePath("/admin/rsvp");
  return { success: true };
}

export async function deleteEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = parseId(formData.get("id"));
  if (id === null) return { error: "Invalid id." };

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  revalidatePath("/admin/rsvp");
  revalidatePath("/admin/logistics");
  revalidatePath("/admin/accommodation");
  return { success: true };
}
