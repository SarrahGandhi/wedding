import { allRows } from "@/lib/supabase/all-rows";
import { confirmedGuestCount } from "@/lib/rsvp-counts";
import { createClient } from "@/lib/supabase/server";
import type { GuestSide, RsvpStatus } from "@/lib/types";
import { PageHeader } from "@/app/shared/PageHeader";
import { StatusIcon } from "@/app/shared/StatusIcon";
import {
  RsvpRoster,
  type RosterFamily,
  type RosterGuest,
} from "./RsvpRoster";
import { familyLabel } from "../guests/family-label";

export default async function RsvpPage() {
  const supabase = await createClient();

  const [events, families, guests, rsvps] = await Promise.all([
    allRows((from, to) => supabase.from("events").select("id, name, date, time").order("date").order("time").order("id").range(from, to)),
    allRows((from, to) => supabase.from("guest_families").select("id, side, family_name").order("id").range(from, to)),
    allRows((from, to) => supabase.from("guests").select("id, name, family_id").order("id").range(from, to)),
    allRows((from, to) => supabase.from("event_guests_rsvp").select("event_id, guest_id, rsvp_status").order("id").range(from, to)),
  ]);

  // Per-guest map of event id → rsvp status.
  const statusByGuest = new Map<number, Record<number, RsvpStatus>>();
  const totals = { pending: 0, declined: 0 };
  for (const r of rsvps) {
    const record = statusByGuest.get(r.guest_id) ?? {};
    record[r.event_id] = r.rsvp_status as RsvpStatus;
    statusByGuest.set(r.guest_id, record);
    if (r.rsvp_status === "PENDING") totals.pending += 1;
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

  const toEntry = (f: {
    id: number;
    side: string;
    family_name: string | null;
  }): RosterFamily => {
    const familyGuests = guestsByFamily.get(f.id) ?? [];
    return {
      id: f.id,
      side: f.side as GuestSide,
      label: familyLabel(
        familyGuests.map((guest) => guest.name),
        f.id,
        f.family_name,
      ),
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
          <div className="flex flex-wrap items-center gap-6 tracking-[0.08em]">
            <span>
              <StatusIcon status="ACCEPTED" className="mr-2" />
              {confirmedGuestCount(rsvps)} confirmed guests
            </span>
            <span>
              <StatusIcon status="PENDING" className="mr-2" />
              {totals.pending} pending event replies
            </span>
            <span>
              <StatusIcon status="DECLINED" className="mr-2" />
              {totals.declined} declined event replies
            </span>
          </div>
        }
      />

      <p className="mb-8 text-sm text-text-secondary">
        The confirmed guest total counts each person once if they accepted any event.
        Pending and declined counts are individual event replies.
      </p>

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
