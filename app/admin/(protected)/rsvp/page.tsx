import { createClient } from "@/lib/supabase/server";
import { addGuestsToEvent, removeRsvpRow } from "./actions";
import { RsvpStatusSelect } from "./RsvpStatusSelect";
import { GUEST_SIDES, type GuestSide, type RsvpStatus } from "@/lib/types";
import { SelectField } from "@/app/shared/FormField";
import { Button } from "@/app/shared/Button";

function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function RsvpPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  const [{ data: events }, { data: families }, { data: allGuests }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, name, date")
        .order("date", { ascending: true }),
      supabase
        .from("guest_families")
        .select("id, side")
        .order("id", { ascending: true }),
      supabase
        .from("guests")
        .select("id, name, family_id")
        .order("name", { ascending: true }),
    ]);

  const requestedId = params.event ? Number(params.event) : NaN;
  const selectedId =
    Number.isFinite(requestedId) && events?.some((e) => e.id === requestedId)
      ? requestedId
      : (events?.[0]?.id ?? null);

  type RsvpRow = {
    id: number;
    rsvp_status: RsvpStatus;
    guest_id: number;
    guest: { id: number; name: string; family_id: number | null } | null;
  };

  let rsvps: RsvpRow[] = [];
  let totals = { pending: 0, accepted: 0, declined: 0, total: 0 };

  if (selectedId !== null) {
    const { data } = await supabase
      .from("event_guests_rsvp")
      .select("id, rsvp_status, guest_id, guest:guests(id, name, family_id)")
      .eq("event_id", selectedId)
      .order("id", { ascending: true });

    rsvps = ((data ?? []) as unknown as RsvpRow[]).slice().sort((a, b) =>
      (a.guest?.name ?? "").localeCompare(b.guest?.name ?? "")
    );
    totals = rsvps.reduce(
      (acc, r) => {
        acc.total += 1;
        if (r.rsvp_status === "PENDING") acc.pending += 1;
        else if (r.rsvp_status === "ACCEPTED") acc.accepted += 1;
        else if (r.rsvp_status === "DECLINED") acc.declined += 1;
        return acc;
      },
      { pending: 0, accepted: 0, declined: 0, total: 0 }
    );
  }

  const selectedEvent = events?.find((e) => e.id === selectedId) ?? null;

  // Compute uninvited guests grouped by side, then by family.
  const invitedGuestIds = new Set(rsvps.map((r) => r.guest_id));
  const familySideById = new Map<number, GuestSide>(
    (families ?? []).map((f) => [f.id, f.side as GuestSide])
  );
  const uninvitedBySide: Record<GuestSide, Map<number, { id: number; name: string }[]>> = {
    BRIDE: new Map(),
    GROOM: new Map(),
  };
  for (const g of allGuests ?? []) {
    if (invitedGuestIds.has(g.id)) continue;
    if (g.family_id == null) continue;
    const side = familySideById.get(g.family_id);
    if (!side) continue;
    const list = uninvitedBySide[side].get(g.family_id) ?? [];
    list.push({ id: g.id, name: g.name });
    uninvitedBySide[side].set(g.family_id, list);
  }
  const uninvitedTotal =
    Array.from(uninvitedBySide.BRIDE.values()).reduce((n, l) => n + l.length, 0) +
    Array.from(uninvitedBySide.GROOM.values()).reduce((n, l) => n + l.length, 0);

  return (
    <div className="animate-fade-up">
      <header className="mb-10 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-2">
            Chapter IV
          </p>
          <h1 className="font-display italic text-5xl font-light text-foreground leading-none">
            Replies.
          </h1>
        </div>
        {selectedEvent && (
          <div className="flex items-center gap-6 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary tabular-nums">
            <span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sage mr-2" />
              {totals.accepted} accepted
            </span>
            <span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted mr-2" />
              {totals.pending} pending
            </span>
            <span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-400 mr-2" />
              {totals.declined} declined
            </span>
          </div>
        )}
      </header>

      {!events || events.length === 0 ? (
        <p className="text-sm text-text-secondary font-body italic">
          No events yet — add one from the Events chapter to begin tracking
          replies.
        </p>
      ) : (
        <>
          {/* Event picker */}
          <section className="mb-8 border-t border-b border-border/40 py-5">
            <form method="get" className="flex items-end gap-3">
              <SelectField
                label="Event"
                name="event"
                defaultValue={String(selectedId ?? "")}
                className="w-auto"
              >
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name} · {formatDate(e.date)}
                  </option>
                ))}
              </SelectField>
              <Button
                variant="secondary"
                type="submit"
                className="hover:text-foreground hover:border-foreground"
              >
                View
              </Button>
            </form>
          </section>

          {selectedEvent && (
            <p className="mb-6 text-sm font-body italic text-text-secondary">
              Replies for{" "}
              <span className="text-foreground not-italic">
                {selectedEvent.name}
              </span>{" "}
              on{" "}
              <span className="tabular-nums">
                {formatDate(selectedEvent.date)}
              </span>
              .
            </p>
          )}

          {/* RSVP table */}
          {rsvps.length === 0 ? (
            <p className="text-sm text-text-secondary font-body italic mb-12">
              No replies on file for this event yet — choose guests below to
              invite them.
            </p>
          ) : (
            <table className="w-full border-collapse mb-12">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-3 px-2 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                    Guest
                  </th>
                  <th className="text-left py-3 px-2 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                    Status
                  </th>
                  <th className="text-right py-3 px-2 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/30 hover:bg-cream/30 transition-colors"
                  >
                    <td className="py-4 px-2 font-display text-lg text-foreground">
                      {r.guest?.name ?? (
                        <span className="text-muted italic">
                          Guest #{r.guest_id} (deleted)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-2">
                      <RsvpStatusSelect
                        rsvpId={r.id}
                        status={r.rsvp_status}
                      />
                    </td>
                    <td className="py-4 px-2 text-right">
                      <form action={removeRsvpRow} className="inline">
                        <input type="hidden" name="rsvp_id" value={r.id} />
                        <Button
                          variant="danger"
                          type="submit"
                          aria-label="Remove guest from event"
                        >
                          Remove
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Add guests panel */}
          {selectedId !== null && (
            <section className="border-t border-border/40 pt-6">
              <div className="mb-4 flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-1">
                    Invite more
                  </p>
                  <p className="text-sm font-body italic text-text-secondary">
                    Pick the guests you’d like to add — they’ll start as
                    pending.
                  </p>
                </div>
                <p className="text-[10px] tracking-[0.25em] uppercase font-body text-text-secondary tabular-nums">
                  {uninvitedTotal}{" "}
                  {uninvitedTotal === 1 ? "guest" : "guests"} not yet invited
                </p>
              </div>

              {uninvitedTotal === 0 ? (
                <p className="text-sm text-text-secondary font-body italic">
                  Every guest is already on this event.
                </p>
              ) : (
                <form action={addGuestsToEvent} className="space-y-8">
                  <input
                    type="hidden"
                    name="event_id"
                    value={selectedId}
                  />
                  {GUEST_SIDES.map((side) => {
                    const families = uninvitedBySide[side];
                    if (families.size === 0) return null;
                    return (
                      <div key={side}>
                        <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-2">
                          {side === "BRIDE"
                            ? "Bride’s side"
                            : "Groom’s side"}
                        </p>
                        <div className="w-10 h-px bg-accent/40 mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                          {Array.from(families.entries()).map(
                            ([familyId, guests]) => (
                              <div key={familyId}>
                                <p className="text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary mb-2">
                                  {guests.map((g) => g.name).join(", ")}
                                </p>
                                <ul className="space-y-1.5">
                                  {guests.map((g) => (
                                    <li key={g.id}>
                                      <label className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                          type="checkbox"
                                          name="guest_ids"
                                          value={g.id}
                                          className="accent-foreground w-4 h-4 cursor-pointer"
                                        />
                                        <span className="font-display text-base text-foreground group-hover:text-accent transition-colors">
                                          {g.name}
                                        </span>
                                      </label>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div className="pt-2">
                    <Button type="submit">Add selected guests</Button>
                  </div>
                </form>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
