"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { RSVP_STATUSES } from "@/lib/types";
import { parseEnum, parseId } from "@/app/shared/action-helpers";

export async function inviteGuestToEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const event_id = parseId(formData.get("event_id"));
  const guest_id = parseId(formData.get("guest_id"));

  if (event_id === null) return { error: "Invalid event id." };
  if (guest_id === null) return { error: "Invalid guest id." };

  const { error } = await supabase
    .from("event_guests_rsvp")
    .upsert(
      { event_id, guest_id, rsvp_status: "PENDING" as const },
      { onConflict: "event_id,guest_id", ignoreDuplicates: true },
    );
  if (error) return { error: error.message };

  revalidatePath("/admin/rsvp");
  return { success: true };
}

export async function setRsvpStatus(formData: FormData) {
  const { supabase } = await requireAdmin();
  const event_id = parseId(formData.get("event_id"));
  const guest_id = parseId(formData.get("guest_id"));
  const status = parseEnum(formData.get("status"), RSVP_STATUSES);

  if (event_id === null) return { error: "Invalid event id." };
  if (guest_id === null) return { error: "Invalid guest id." };
  if (!status) return { error: "Invalid status." };

  const { error } = await supabase
    .from("event_guests_rsvp")
    .update({ rsvp_status: status })
    .eq("event_id", event_id)
    .eq("guest_id", guest_id);
  if (error) return { error: error.message };

  revalidatePath("/admin/rsvp");
  return { success: true };
}

export async function uninviteGuestFromEvent(formData: FormData) {
  const { supabase } = await requireAdmin();
  const event_id = parseId(formData.get("event_id"));
  const guest_id = parseId(formData.get("guest_id"));

  if (event_id === null) return { error: "Invalid event id." };
  if (guest_id === null) return { error: "Invalid guest id." };

  const { error } = await supabase
    .from("event_guests_rsvp")
    .delete()
    .eq("event_id", event_id)
    .eq("guest_id", guest_id);
  if (error) return { error: error.message };

  revalidatePath("/admin/rsvp");
  return { success: true };
}
