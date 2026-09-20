"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { parseTask, taskIdentity } from "@/lib/tasks";

const staleMessage = "This task has changed. Refresh the page and reopen it before trying again.";

export async function saveTask(form: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = parseTask(form);
  if (!parsed.data) return { error: parsed.error };

  if (form.has("id")) {
    const row = taskIdentity(form);
    if (!row) return { error: "Refresh the page and try again." };
    const { data, error } = await supabase.from("tasks")
      .update(parsed.data).eq("id", row.id).eq("revision", row.revision).select("id").maybeSingle();
    if (error) return { error: "Could not save this task. Try again." };
    if (!data) return { error: staleMessage };
  } else {
    const { error } = await supabase.from("tasks").insert(parsed.data);
    if (error) return { error: "Could not add this task. Try again." };
  }
  revalidatePath("/admin/tasks");
  return { success: true };
}

export async function setTaskCompleted(form: FormData) {
  const { supabase } = await requireAdmin();
  const row = taskIdentity(form);
  const completed = form.get("completed");
  if (!row || (completed !== "true" && completed !== "false")) {
    return { error: "Refresh the page and try again." };
  }
  const { data, error } = await supabase.from("tasks")
    .update({ completed: completed === "true" })
    .eq("id", row.id).eq("revision", row.revision).select("id").maybeSingle();
  if (error) return { error: "Could not update this task. Try again." };
  if (!data) return { error: staleMessage };
  revalidatePath("/admin/tasks");
  return { success: true };
}
