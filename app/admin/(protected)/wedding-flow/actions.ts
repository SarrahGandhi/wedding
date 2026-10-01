"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { parseFlowEntry } from "@/lib/wedding-flow";

export async function mutateFlowEntry(form: FormData) {
  const { supabase } = await requireAdmin();
  const operation = form.get("operation");
  if (!["save", "complete", "delete"].includes(String(operation))) return { error: "Unknown action." };
  const id = Number(form.get("id"));
  const revision = Number(form.get("revision"));
  const existing = form.has("id");
  if ((existing || operation !== "save") && (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(revision) || revision <= 0)) return { error: "Refresh the page and try again." };
  let result;
  if (operation === "save") {
    const parsed = parseFlowEntry(form);
    if (!parsed.data) return { error: parsed.error };
    result = existing
      ? await supabase.from("wedding_flow_entries").update(parsed.data).eq("id", id).eq("revision", revision).select("id").maybeSingle()
      : await supabase.from("wedding_flow_entries").insert(parsed.data).select("id").single();
  } else if (operation === "delete") {
    result = await supabase.from("wedding_flow_entries").delete().eq("id", id).eq("revision", revision).select("id").maybeSingle();
  } else {
    const completed = form.get("completed");
    if (completed !== "true" && completed !== "false") return { error: "Invalid completion status." };
    result = await supabase.from("wedding_flow_entries").update({ completed: completed === "true" }).eq("id", id).eq("revision", revision).select("id").maybeSingle();
  }
  if (result.error) return { error: "Could not save this change. Please try again." };
  if (!result.data) return { error: "This entry has changed. Refresh the page before trying again." };
  revalidatePath("/admin/wedding-flow");
  return { success: true };
}
