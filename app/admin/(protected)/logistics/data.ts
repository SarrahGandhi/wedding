import "server-only";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { accommodationLabel, compareNames, type LogisticsFamily } from "@/lib/logistics";
import { familyLabel } from "../guests/family-label";
import { attendingGuestsByFamily } from "@/lib/logistics-attendance";

// RSVP counts can exceed Supabase's 1,000-row limit long before family counts.
async function allRows<T>(query: (from: number, to: number) => PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>) {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

export async function getLogisticsData() {
  const { supabase } = await requireAdmin();
  const [families, guests, accepted, logistics, accommodations] = await Promise.all([
    allRows((from, to) => supabase.from("guest_families").select("id, side, family_name").order("id").range(from, to)),
    allRows((from, to) => supabase.from("guests").select("id, name, family_id").order("id").range(from, to)),
    allRows((from, to) => supabase.from("event_guests_rsvp").select("guest_id, rsvp_status").eq("rsvp_status", "ACCEPTED").order("id").range(from, to)),
    allRows((from, to) => supabase.from("family_logistics").select("*").order("family_id").range(from, to)),
    allRows((from, to) => supabase.from("accommodations").select("*").order("id").range(from, to)),
  ]);

  const attendingByFamily = attendingGuestsByFamily(guests, accepted);
  const logisticsByFamily = new Map(logistics.map((entry) => [entry.family_id, entry]));
  const staysById = new Map(accommodations.map((stay) => [stay.id, stay]));
  const confirmedFamilies: LogisticsFamily[] = [];
  for (const family of families) {
    const confirmed = attendingByFamily.get(family.id) ?? [];
    if (confirmed.length === 0) continue;
    const details = logisticsByFamily.get(family.id) ?? null;
    confirmedFamilies.push({
      id: family.id,
      label: familyLabel(confirmed.map((guest) => guest.name), family.id, family.family_name),
      side: family.side,
      guests: confirmed,
      logistics: details,
      accommodation: staysById.get(details?.accommodation_id ?? -1) ?? null,
    });
  }
  return {
    families: confirmedFamilies.sort((a, b) => compareNames(a.label, b.label)),
    accommodations: accommodations.sort((a, b) => compareNames(accommodationLabel(a), accommodationLabel(b))),
  };
}
