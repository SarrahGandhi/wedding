"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { parseArrivalPlans, parseDepartureForm, parseLogisticsForm } from "@/lib/logistics";

export async function setArrivalSupportRequired(form: FormData) {
  const { supabase } = await requireAdmin();
  const familyId = Number(form.get("family_id"));
  const required = form.get("required");
  if (!Number.isSafeInteger(familyId) || familyId <= 0 || (required !== "true" && required !== "false")) {
    return { error: "Choose a valid family and arrangement status." };
  }
  // Update only the requirement flag, preserving saved plans for re-enabling.
  const { error } = await supabase.from("family_logistics").upsert({
    family_id: familyId, arrival_support_required: required === "true",
  }, { onConflict: "family_id" });
  if (error) return { error: "Could not update the arrangement requirement. Please try again." };
  revalidatePath("/admin/logistics");
  revalidatePath("/admin/accommodation");
  return { success: true };
}

export async function saveFamilyDeparture(formData: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = parseDepartureForm(formData);
  if (parsed.error) return { error: parsed.error };
  const { error } = await supabase.rpc("save_family_departure", parsed.data);
  if (error) return { error: error.message };
  revalidatePath("/admin/logistics");
  return { success: true };
}

export async function saveFamilyLogistics(formData: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = parseLogisticsForm(formData);
  if (parsed.error) return { error: parsed.error };
  const arrivals = parseArrivalPlans(formData);
  if (!arrivals.data) return { error: arrivals.error };
  const values = { ...parsed.data };
  if (values.p_accommodation_id !== null) {
    const { data: accommodation, error } = await supabase
      .from("accommodations")
      .select("kind, name")
      .eq("id", values.p_accommodation_id)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!accommodation) return { error: "This accommodation is no longer available. Refresh the page and choose another." };
    if (accommodation.kind === "HOTEL") {
      // Resolve the selected hotel's name on the server, then reuse/create its
      // requested room atomically without changing any other family's stay.
      values.p_accommodation_id = null;
      values.p_new_kind = "HOTEL";
      values.p_new_name = accommodation.name;
    } else {
      values.p_new_room_number = null;
    }
  }
  const { error } = await supabase.rpc("save_family_arrivals", {
    p_family_id: values.p_family_id,
    p_arrivals: arrivals.data,
    p_accommodation_id: values.p_accommodation_id,
    p_new_kind: values.p_new_kind,
    p_new_name: values.p_new_name,
    p_new_room_number: values.p_new_room_number,
  });
  if (error) {
    return { error: error.code === "23503"
      ? "This accommodation is no longer available. Refresh the page and choose another."
      : error.message };
  }
  revalidatePath("/admin/logistics");
  revalidatePath("/admin/accommodation");
  return { success: true };
}
