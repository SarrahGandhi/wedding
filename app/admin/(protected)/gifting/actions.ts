"use server";

import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { parseGiftPlan } from "@/lib/gifting";

export async function saveGiftPlan(value: unknown, revision: number) {
  const { supabase, user } = await requireAdmin();
  const { data: allowed } = await supabase.rpc("can_access_gifting");
  if (!allowed) notFound();
  if (!Number.isSafeInteger(revision) || revision < 0) return { error: "Invalid save version. Reload the page." };
  let recipients;
  try { recipients = parseGiftPlan(value); }
  catch (error) { return { error: error instanceof Error ? error.message : "Check your gifting entries." }; }
  const query = revision === 0
    ? supabase.from("gifting_plans").insert({ owner_id: user.id, recipients })
    : supabase.from("gifting_plans").update({ recipients }).eq("owner_id", user.id).eq("revision", revision);
  const { data, error } = await query.select("revision").maybeSingle();
  if (error?.code === "23505" || (!error && !data)) {
    return { error: "A newer plan was saved in another tab. Your edits are still here; copy them before reloading to see the latest plan." };
  }
  if (error || !data) return { error: "Your plan could not be saved. Your edits are still here. Try saving again." };
  return { revision: data.revision };
}
