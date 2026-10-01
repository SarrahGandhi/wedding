import type { Metadata } from "next";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import type { FlowEntry } from "@/lib/wedding-flow";
import { PageHeader } from "@/app/shared/PageHeader";
import { WeddingFlow } from "./WeddingFlow";

export const metadata: Metadata = { title: "Wedding Flow | Murtaza & Sarrah" };
export default async function WeddingFlowPage() {
  const { supabase } = await requireAdmin();
  const events = await supabase.from("events").select("id,name,date,time,location").order("date").order("time");
  const entries: FlowEntry[] = [];
  let unavailable = false;
  for (let offset = 0; ; offset += 1000) {
    const result = await supabase.from("wedding_flow_entries").select("*").order("id").range(offset, offset + 999);
    if (result.error) { unavailable = true; break; }
    entries.push(...result.data);
    if (result.data.length < 1000) break;
  }
  if (events.error || unavailable) return <div className="space-y-6"><PageHeader title="Wedding Flow." /><p role="alert" className="rounded-2xl bg-blush/50 p-6">Wedding Flow could not be loaded. Please try refreshing. If this is the first visit after an update, the Wedding Flow database migration must be applied.</p></div>;
  return <WeddingFlow events={events.data} entries={entries} />;
}
