import { createClient } from "@/lib/supabase/server";
import type { GuestSide, RsvpStatus } from "@/lib/types";
import { PageHeader } from "@/app/shared/PageHeader";
import { StatusDot } from "@/app/shared/StatusDot";
import {
  RsvpRoster,
  type RosterFamily,
  type RosterGuest,
} from "./RsvpRoster";

export default async function RsvpPage() {
  const supabase = await createClient();

  const [{ data: events }, { data: families }, { data: guests }, { data: rsvps }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, name, date, time")
        .order("date", { ascending: true })
        .order("time", { ascending: true }),
      supabase
        .from("guest_families")
        .select("id, side")
        .order("id", { ascending: true }),
      supabase
        .from("guests")
        .select("id, name, family_id")
        .order("id", { ascending: true }),
      supabase
        .from("event_guests_rsvp")
        .select("event_id, guest_id, rsvp_status"),
    ]);

  // Per-guest map of event id → rsvp status.
  const statusByGuest = new Map<number, Record<number, RsvpStatus>>();
  const totals = { pending: 0, accepted: 0, declined: 0 };
  for (const r of rsvps ?? []) {
    const record = statusByGuest.get(r.guest_id) ?? {};
    record[r.event_id] = r.rsvp_status as RsvpStatus;
    statusByGuest.set(r.guest_id, record);
    if (r.rsvp_status === "PENDING") totals.pending += 1;
    else if (r.rsvp_status === "ACCEPTED") totals.accepted += 1;
    else if (r.rsvp_status === "DECLINED") totals.declined += 1;
  }

  const guestsByFamily = new Map<number, RosterGuest[]>();
  for (const g of guests ?? []) {
    if (g.family_id == null) continue;
    const list = guestsByFamily.get(g.family_id) ?? [];
    list.push({
      id: g.id,
      name: g.name,
      statusByEvent: statusByGuest.get(g.id) ?? {},
    });
    guestsByFamily.set(g.family_id, list);
  }

  const toEntry = (f: { id: number; side: string }): RosterFamily => {
    const familyGuests = guestsByFamily.get(f.id) ?? [];
    return {
      id: f.id,
      side: f.side as GuestSide,
      label:
        familyGuests.length === 0
          ? `Empty family · #${f.id}`
          : familyGuests.map((g) => g.name).join(", "),
      guests: familyGuests,
    };
  };

  const brideFamilies = (families ?? [])
    .filter((f) => f.side === "BRIDE")
    .map(toEntry);
  const groomFamilies = (families ?? [])
    .filter((f) => f.side === "GROOM")
    .map(toEntry);

  return (
    <div className="animate-fade-up">
      <PageHeader
        chapter="Chapter IV"
        title="Replies."
        meta={
          <div className="flex items-center gap-6 tracking-[0.3em]">
            <span>
              <StatusDot status="ACCEPTED" className="mr-2" />
              {totals.accepted} accepted
            </span>
            <span>
              <StatusDot status="PENDING" className="mr-2" />
              {totals.pending} pending
            </span>
            <span>
              <StatusDot status="DECLINED" className="mr-2" />
              {totals.declined} declined
            </span>
          </div>
        }
      />

      {!events || events.length === 0 ? (
        <p className="text-sm text-text-secondary font-body italic">
          No events yet — add one from the Events chapter to begin sending
          invitations.
        </p>
      ) : (
        <RsvpRoster
          brideFamilies={brideFamilies}
          groomFamilies={groomFamilies}
          events={events.map((e) => ({ id: e.id, name: e.name }))}
        />
      )}
    </div>
  );
}
