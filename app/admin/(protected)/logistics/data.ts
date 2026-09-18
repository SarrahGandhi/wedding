import "server-only";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { accommodationLabel, compareNames, type LogisticsFamily } from "@/lib/logistics";
import { familyLabel } from "../guests/family-label";

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
    allRows((from, to) => supabase.from("guest_families").select("id, side").order("id").range(from, to)),
    allRows((from, to) => supabase.from("guests").select("id, name, family_id").order("id").range(from, to)),
    allRows((from, to) => supabase.from("event_guests_rsvp").select("guest_id").eq("rsvp_status", "ACCEPTED").order("id").range(from, to)),
    allRows((from, to) => supabase.from("family_logistics").select("*").order("family_id").range(from, to)),
    allRows((from, to) => supabase.from("accommodations").select("*").order("id").range(from, to)),
  ]);

  const confirmedIds = new Set(accepted.map((rsvp) => rsvp.guest_id));
  const guestsByFamily = new Map<number, typeof guests>();
  for (const guest of guests) {
    const list = guestsByFamily.get(guest.family_id) ?? [];
    list.push(guest);
    guestsByFamily.set(guest.family_id, list);
  }
  const logisticsByFamily = new Map(logistics.map((entry) => [entry.family_id, entry]));
  const staysById = new Map(accommodations.map((stay) => [stay.id, stay]));
  const confirmedFamilies: LogisticsFamily[] = [];
  for (const family of families) {
    const members = guestsByFamily.get(family.id) ?? [];
    const confirmed = members.filter((guest) => confirmedIds.has(guest.id));
    if (confirmed.length === 0) continue;
    const details = logisticsByFamily.get(family.id) ?? null;
    confirmedFamilies.push({
      id: family.id,
      label: familyLabel(members.map((guest) => guest.name), family.id),
      side: family.side,
      guests: confirmed.map(({ id, name }) => ({ id, name })),
      logistics: details,
      accommodation: staysById.get(details?.accommodation_id ?? -1) ?? null,
    });
  }
  return {
    families: confirmedFamilies.sort((a, b) => compareNames(a.label, b.label)),
    accommodations: accommodations.sort((a, b) => compareNames(accommodationLabel(a), accommodationLabel(b))),
  };
}
