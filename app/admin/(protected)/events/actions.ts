"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { parseId, parseNullable, parseString } from "@/app/shared/action-helpers";
import { DATE_RE, TIME_RE } from "@/app/shared/event-date-time";

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
  return { success: true };
}
