import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { parseGiftPlan } from "@/lib/gifting";
import { PageHeader } from "@/app/shared/PageHeader";
import { GiftingWorkspace } from "./GiftingWorkspace";

export const metadata: Metadata = { title: "Gifting | Murtaza & Sarrah" };

export default async function GiftingPage() {
  const { supabase, user } = await requireAdmin();
  const { data: allowed } = await supabase.rpc("can_access_gifting");
  if (!allowed) notFound();
  const { data, error } = await supabase.from("gifting_plans").select("recipients,revision").eq("owner_id", user.id).maybeSingle();
  if (error) return <><PageHeader title="Gifting." /><p role="alert">Your gifting plan could not be loaded. Please refresh to try again.</p></>;
  const recipients = parseGiftPlan(data?.recipients ?? []);
  return <><PageHeader title="Gifting." /><GiftingWorkspace initialRecipients={recipients} initialRevision={data?.revision ?? 0} /></>;
}
