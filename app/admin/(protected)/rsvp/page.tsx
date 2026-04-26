import { createClient } from "@/lib/supabase/server";
import { ensureEventRsvpRows } from "./actions";
import { RsvpStatusSelect } from "./RsvpStatusSelect";

type Status = "PENDING" | "ACCEPTED" | "DECLINED";

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

  const { data: events } = await supabase
    .from("events")
    .select("id, name, date")
    .order("date", { ascending: true });

  const requestedId = params.event ? Number(params.event) : NaN;
  const selectedId =
    Number.isFinite(requestedId) && events?.some((e) => e.id === requestedId)
      ? requestedId
      : (events?.[0]?.id ?? null);

  type RsvpRow = {
    id: number;
    rsvp_status: Status;
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
          <section className="mb-8 border-t border-b border-border/40 py-5 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <form method="get" className="flex items-end gap-3">
              <label className="block">
                <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body">
                  Event
                </span>
                <select
                  name="event"
                  defaultValue={String(selectedId ?? "")}
                  className="mt-1 bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
                >
                  {events.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} · {formatDate(e.date)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="px-4 py-2 border border-border text-text-secondary hover:text-foreground hover:border-foreground text-[10px] tracking-[0.25em] uppercase font-body transition-colors cursor-pointer"
              >
                View
              </button>
            </form>

            {selectedId !== null && (
              <form action={ensureEventRsvpRows}>
                <input type="hidden" name="event_id" value={selectedId} />
                <button
                  type="submit"
                  className="px-4 py-2 bg-foreground text-background text-[10px] tracking-[0.3em] uppercase font-body hover:bg-accent transition-colors cursor-pointer"
                >
                  Sync guests
                </button>
              </form>
            )}
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
            <p className="text-sm text-text-secondary font-body italic">
              No replies on file for this event yet. Press{" "}
              <span className="not-italic">“Sync guests”</span> above to seed
              pending rows.
            </p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-3 px-2 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                    Guest
                  </th>
                  <th className="text-left py-3 px-2 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                    Status
                  </th>
                  <th className="text-right py-3 px-2 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                    ID
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
                    <td className="py-4 px-2 text-right text-[10px] tracking-[0.25em] uppercase font-body text-text-secondary tabular-nums">
                      #{r.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
