"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { parseLogisticsForm } from "@/lib/logistics";

export async function saveFamilyLogistics(formData: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = parseLogisticsForm(formData);
  if (parsed.error) return { error: parsed.error };
  const values = { ...parsed.data };
  if (values.p_accommodation_id !== null) {
    const { data: accommodation, error } = await supabase
      .from("accommodations")
      .select("kind, name")
      .eq("id", values.p_accommodation_id)
      .maybeSingle();
    if (error) return { error: error.message };
    if (!accommodation) return { error: "This accommodation is no longer available. Refresh the page and choose another." };
    // Resolve the property on the server, then reuse/create its requested room
    // atomically without changing any other family's stay.
    values.p_accommodation_id = null;
    values.p_new_kind = accommodation.kind;
    values.p_new_name = accommodation.name;
  }
  const { error } = await supabase.rpc("save_family_logistics", values);
  if (error) {
    return { error: error.code === "23503"
      ? "This accommodation is no longer available. Refresh the page and choose another."
      : error.message };
  }
  revalidatePath("/admin/logistics");
  revalidatePath("/admin/accommodation");
  return { success: true };
}
