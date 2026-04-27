import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { RSVP_STATUSES } from "@/lib/types";

async function getCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: "guests" | "guest_families" | "events" | "event_guests_rsvp",
  filter?: { column: string; value: string }
) {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) {
    query = query.eq(filter.column, filter.value);
  }
  const { count } = await query;
  return count ?? 0;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const [guests, families, events, pending] = await Promise.all([
    getCount(supabase, "guests"),
    getCount(supabase, "guest_families"),
    getCount(supabase, "events"),
    getCount(supabase, "event_guests_rsvp", {
      column: "rsvp_status",
      value: RSVP_STATUSES[0],
    }),
  ]);

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
      count: events,
      sub: null,
      href: "/admin/events",
      roman: "II",
    },
    {
      label: "Pending RSVP",
      count: pending,
      sub: null,
      href: "/admin/rsvp",
      roman: "III",
      emphasise: pending > 0,
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border/40 border border-border/40">
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
                <span
                  className={`font-display text-6xl font-light leading-none tabular-nums ${
                    card.emphasise ? "text-accent" : "text-foreground"
                  }`}
                >
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

      <p className="mt-12 text-xs text-text-secondary font-body italic max-w-prose leading-relaxed">
        A working notebook for the days ahead. Use the chapters above to mind
        the roster of families and their guests, the order of events, and the
        replies still owed.
      </p>
    </div>
  );
}
