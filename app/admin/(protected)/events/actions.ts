"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function nullable(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v ? v : null;
}

export async function createEvent(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const location = nullable(formData.get("location"));
  const dress_code = nullable(formData.get("dress_code"));
  const details = nullable(formData.get("details"));

  if (!name) throw new Error("Name is required.");
  if (!DATE_RE.test(date)) throw new Error("Date must be YYYY-MM-DD.");

  const { error } = await supabase
    .from("events")
    .insert({ name, date, location, dress_code, details });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/events");
  revalidatePath("/admin/rsvp");
}

export async function updateEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const location = nullable(formData.get("location"));
  const dress_code = nullable(formData.get("dress_code"));
  const details = nullable(formData.get("details"));

  if (!Number.isFinite(id)) return { error: "Invalid id." };
  if (!name) return { error: "Name is required." };
  if (!DATE_RE.test(date)) return { error: "Date must be YYYY-MM-DD." };

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
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { error: "Invalid id." };

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  revalidatePath("/admin/rsvp");
  return { success: true };
}
