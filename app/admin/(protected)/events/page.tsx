import { createClient } from "@/lib/supabase/server";
import { createEvent } from "./actions";
import { EventRow } from "./EventRow";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, date, location, dress_code, details")
    .order("date", { ascending: true });

  return (
    <div className="animate-fade-up">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-2">
            Chapter III
          </p>
          <h1 className="font-display italic text-5xl font-light text-foreground leading-none">
            Events.
          </h1>
        </div>
        <p className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body tabular-nums">
          {events?.length ?? 0} on the calendar
        </p>
      </header>

      {/* Create form */}
      <section className="mb-10 border-t border-b border-border/40 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-4">
          New event
        </p>
        <form
          action={createEvent}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          <label className="block">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Name
            </span>
            <input
              name="name"
              required
              placeholder="Mehndi, Sangeet, Ceremony…"
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Date
            </span>
            <input
              name="date"
              type="date"
              required
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Location (optional)
            </span>
            <input
              name="location"
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Dress code (optional)
            </span>
            <input
              name="dress_code"
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
            />
          </label>
          <label className="block md:col-span-2">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Details (optional)
            </span>
            <textarea
              name="details"
              rows={3}
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm leading-relaxed focus:outline-none focus:border-accent/60 transition-colors resize-y"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="px-5 py-2 bg-foreground text-background text-[10px] tracking-[0.3em] uppercase font-body hover:bg-accent transition-colors cursor-pointer"
            >
              Add event
            </button>
          </div>
        </form>
      </section>

      {/* List */}
      {!events || events.length === 0 ? (
        <p className="text-sm text-text-secondary font-body italic">
          No events yet.
        </p>
      ) : (
        <div>
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}
