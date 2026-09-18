"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { parseCategory } from "@/lib/budgeting";

function identity(form: FormData) {
  const id = Number(form.get("id"));
  const revision = Number(form.get("revision"));
  return Number.isSafeInteger(id) && id > 0 && Number.isSafeInteger(revision) && revision > 0
    ? { id, revision } : null;
}

export async function saveCategory(form: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = parseCategory(form);
  if (parsed.error || !parsed.data) return { error: parsed.error ?? "Check the category details." };

  if (form.has("id")) {
    const row = identity(form);
    if (!row) return { error: "This category could not be identified. Refresh the page and try again." };
    const { data, error } = await supabase.from("budget_categories")
      .update(parsed.data).eq("id", row.id).eq("revision", row.revision).select("id").maybeSingle();
    if (error) return { error: "Could not save this category. Try again." };
    if (!data) return { error: "This category changed since you opened it. Cancel and reopen the form to load the latest amounts." };
  } else {
    const { error } = await supabase.from("budget_categories").insert(parsed.data);
    if (error) return { error: "Could not add this category. Try again." };
  }
  revalidatePath("/admin/budgeting");
  return { success: true };
}

export async function deleteCategory(form: FormData) {
  const { supabase } = await requireAdmin();
  const row = identity(form);
  if (!row) return { error: "This category could not be identified. Refresh the page and try again." };
  const { data, error } = await supabase.from("budget_categories")
    .delete().eq("id", row.id).eq("revision", row.revision).select("id").maybeSingle();
  if (error) return { error: "Could not delete this category. Try again." };
  if (!data) return { error: "This category has changed. Refresh the page before deleting it." };
  revalidatePath("/admin/budgeting");
  return { success: true };
}
