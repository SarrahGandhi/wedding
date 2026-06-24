"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import {
  DATE_TIME_LOCAL_RE,
  parseId,
  parseNullable,
  parseString,
} from "@/app/shared/action-helpers";

export async function createEvent(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const name = parseString(formData.get("name"));
  const date = parseString(formData.get("date"));
  const location = parseNullable(formData.get("location"));
  const dress_code = parseNullable(formData.get("dress_code"));
  const details = parseNullable(formData.get("details"));

  if (!name) throw new Error("Name is required.");
  if (!DATE_TIME_LOCAL_RE.test(date)) {
    throw new Error("Date and time must be YYYY-MM-DDTHH:mm.");
  }

  const { error } = await supabase
    .from("events")
    .insert({ name, date, location, dress_code, details });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/events");
  revalidatePath("/admin/rsvp");
}

export async function updateEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = parseId(formData.get("id"));
  const name = parseString(formData.get("name"));
  const date = parseString(formData.get("date"));
  const location = parseNullable(formData.get("location"));
  const dress_code = parseNullable(formData.get("dress_code"));
  const details = parseNullable(formData.get("details"));

  if (id === null) return { error: "Invalid id." };
  if (!name) return { error: "Name is required." };
  if (!DATE_TIME_LOCAL_RE.test(date)) {
    return { error: "Date and time must be YYYY-MM-DDTHH:mm." };
  }

  const { error } = await supabase
    .from("events")
    .update({ name, date, location, dress_code, details })
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
