import { createClient } from "@/lib/supabase/server";
import { createEvent } from "./actions";
import { EventRow } from "./EventRow";
import { FormField, TextareaField } from "@/app/shared/FormField";
import { Button } from "@/app/shared/Button";
import { PageHeader } from "@/app/shared/PageHeader";

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, name, date, time, location, dress_code, details")
    .order("date", { ascending: true })
    .order("time", { ascending: true });

  return (
    <div className="animate-fade-up">
      <PageHeader
        chapter="Chapter III"
        title="Events."
        meta={<>{events?.length ?? 0} on the calendar</>}
      />

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
          <FormField
            label="Date"
            name="date"
            type="date"
            required
          />
          <FormField label="Time" name="time" type="time" required />
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
