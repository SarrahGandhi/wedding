import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatusDot } from "@/app/shared/StatusDot";

async function getCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "guests" | "guest_families" | "events"
) {
  const { count } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

type EventTally = {
  invited: number;
  pending: number;
  accepted: number;
  declined: number;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const [guests, families, { data: events }, { data: rsvps }] =
    await Promise.all([
      getCount(supabase, "guests"),
      getCount(supabase, "guest_families"),
      supabase
        .from("events")
        .select("id, name, date, time")
        .order("date", { ascending: true })
        .order("time", { ascending: true }),
      supabase.from("event_guests_rsvp").select("event_id, rsvp_status"),
    ]);

  const tallyByEvent = new Map<number, EventTally>();
  for (const r of rsvps ?? []) {
    const tally =
      tallyByEvent.get(r.event_id) ??
      ({ invited: 0, pending: 0, accepted: 0, declined: 0 } satisfies EventTally);
    tally.invited += 1;
    if (r.rsvp_status === "PENDING") tally.pending += 1;
    else if (r.rsvp_status === "ACCEPTED") tally.accepted += 1;
    else if (r.rsvp_status === "DECLINED") tally.declined += 1;
    tallyByEvent.set(r.event_id, tally);
  }

  const cards = [
    {
      label: "Roster",
      count: guests,
      sub: `${families} ${families === 1 ? "family" : "families"}`,
      href: "/admin/guests",
      roman: "I",
    },
    {
      label: "Events",
      count: events?.length ?? 0,
      sub: null,
      href: "/admin/events",
      roman: "II",
    },
  ];

  return (
    <div className="animate-fade-up">
      <header className="mb-12">
        <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-3">
          The Ledger
        </p>
        <h1 className="font-display italic text-5xl md:text-6xl font-light text-foreground leading-none">
          Overview.
        </h1>
        <div className="mt-5 w-12 h-px bg-accent/40" />
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/40 border border-border/40">
        {cards.map((card, i) => (
          <Link
            key={card.href}
            href={card.href}
            className={`group bg-warm-white p-7 flex flex-col gap-6 hover:bg-cream/40 transition-colors animate-fade-up delay-${(i + 1) * 100}`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-display italic text-sm text-text-secondary">
                {card.roman}.
              </span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body">
                {card.label}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span className="font-display text-6xl font-light leading-none tabular-nums text-foreground">
                  {card.count}
                </span>
                {card.sub && (
                  <span className="mt-2 text-[10px] tracking-[0.25em] uppercase font-body text-muted tabular-nums">
                    {card.sub}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-[0.25em] uppercase font-body text-text-secondary group-hover:text-accent transition-colors">
                Manage &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>

      <section className="mt-12 animate-fade-up delay-300">
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display italic text-sm text-text-secondary">
              III.
            </span>
            <span className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body">
              Replies by event
            </span>
          </div>
          <Link
            href="/admin/rsvp"
            className="text-[10px] tracking-[0.25em] uppercase font-body text-text-secondary hover:text-accent transition-colors"
          >
            Manage &rarr;
          </Link>
        </div>

        {!events || events.length === 0 ? (
          <p className="text-sm text-text-secondary font-body italic">
            No events yet — add one from the Events chapter to begin sending
            invitations.
          </p>
        ) : (
          <div className="border border-border/40 bg-border/40 flex flex-col gap-px">
            {events.map((event) => {
              const tally = tallyByEvent.get(event.id) ?? {
                invited: 0,
                pending: 0,
                accepted: 0,
                declined: 0,
              };
              return (
                <Link
                  key={event.id}
                  href="/admin/rsvp"
                  className="group bg-warm-white px-7 py-5 flex flex-col sm:flex-row sm:items-baseline gap-3 sm:gap-6 hover:bg-cream/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <span className="font-display italic text-lg text-foreground">
                      {event.name}
                    </span>
                    <span className="ml-3 text-[10px] tracking-[0.25em] uppercase font-body text-muted tabular-nums">
                      {tally.invited} invited
                    </span>
                  </div>
                  <div className="flex items-baseline gap-5 text-[10px] tracking-[0.25em] uppercase font-body text-text-secondary tabular-nums">
                    <span>
                      <StatusDot status="ACCEPTED" className="mr-2" />
                      {tally.accepted} accepted
                    </span>
                    <span className={tally.pending > 0 ? "text-accent" : ""}>
                      <StatusDot status="PENDING" className="mr-2" />
                      {tally.pending} pending
                    </span>
                    <span>
                      <StatusDot status="DECLINED" className="mr-2" />
                      {tally.declined} declined
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-12 text-xs text-text-secondary font-body italic max-w-prose leading-relaxed">
        A working notebook for the days ahead. Use the chapters above to mind
        the roster of families and their guests, the order of events, and the
        replies still owed.
      </p>
    </div>
  );
}
