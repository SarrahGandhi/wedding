"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import type { Enums } from "@/lib/supabase/database.types";

const STATUSES: Enums<"event_rsvp_status">[] = [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
];

function parseStatus(
  value: FormDataEntryValue | null
): Enums<"event_rsvp_status"> | null {
  const v = String(value ?? "");
  return (STATUSES as string[]).includes(v)
    ? (v as Enums<"event_rsvp_status">)
    : null;
}

export async function setRsvpStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = Number(formData.get("rsvp_id"));
  const status = parseStatus(formData.get("status"));

  if (!Number.isFinite(id)) return { error: "Invalid RSVP id." };
  if (!status) return { error: "Invalid status." };

  const { error } = await supabase
    .from("event_guests_rsvp")
    .update({ rsvp_status: status })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/rsvp");
  return { success: true };
}

export async function ensureEventRsvpRows(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const event_id = Number(formData.get("event_id"));
  if (!Number.isFinite(event_id)) throw new Error("Invalid event id.");

  const { data: guests, error: guestsError } = await supabase
    .from("guests")
    .select("id");
  if (guestsError) throw new Error(guestsError.message);

  if (!guests || guests.length === 0) {
    revalidatePath("/admin/rsvp");
    return;
  }

  const rows = guests.map((g) => ({
    event_id,
    guest_id: g.id,
    rsvp_status: "PENDING" as const,
  }));

  const { error } = await supabase
    .from("event_guests_rsvp")
    .upsert(rows, { onConflict: "event_id,guest_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/rsvp");
}
