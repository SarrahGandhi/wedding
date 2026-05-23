"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { RSVP_STATUSES } from "@/lib/types";
import { parseEnum, parseId } from "@/app/shared/action-helpers";

export async function setRsvpStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = parseId(formData.get("rsvp_id"));
  const status = parseEnum(formData.get("status"), RSVP_STATUSES);

  if (id === null) return { error: "Invalid RSVP id." };
  if (!status) return { error: "Invalid status." };

  const { error } = await supabase
    .from("event_guests_rsvp")
    .update({ rsvp_status: status })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/rsvp");
  return { success: true };
}

export async function addGuestsToEvent(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const event_id = parseId(formData.get("event_id"));
  if (event_id === null) throw new Error("Invalid event id.");

  const guestIds = formData
    .getAll("guest_ids")
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n));

  if (guestIds.length === 0) {
    revalidatePath("/admin/rsvp");
    return;
  }

  const rows = guestIds.map((guest_id) => ({
    event_id,
    guest_id,
    rsvp_status: "PENDING" as const,
  }));

  const { error } = await supabase
    .from("event_guests_rsvp")
    .upsert(rows, { onConflict: "event_id,guest_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/rsvp");
}

export async function removeRsvpRow(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const id = parseId(formData.get("rsvp_id"));
  if (id === null) throw new Error("Invalid RSVP id.");

  const { error } = await supabase
    .from("event_guests_rsvp")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/rsvp");
}
