import { createClient } from "@/lib/supabase/server";
import { createEvent } from "./actions";
import { EventRow } from "./EventRow";
import { FormField, TextareaField } from "@/app/shared/FormField";
import { Button } from "@/app/shared/Button";

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
          <FormField
            label="Name"
            name="name"
            required
            placeholder="Mehndi, Sangeet, Ceremony…"
          />
          <FormField label="Date" name="date" type="date" required />
          <FormField label="Location (optional)" name="location" />
          <FormField label="Dress code (optional)" name="dress_code" />
          <TextareaField
            label="Details (optional)"
            name="details"
            rows={3}
            labelClassName="md:col-span-2"
          />
          <div className="md:col-span-2">
            <Button type="submit">Add event</Button>
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
