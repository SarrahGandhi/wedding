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
    <div className="animate-fade-up space-y-10">
      <PageHeader
        chapter="Chapter III"
        title="Events."
        meta={<>{events?.length ?? 0} on the calendar</>}
      />

      <section className="rounded-[2rem] border border-white/70 bg-linear-to-br from-warm-white via-powder to-peach/45 p-5 shadow-[0_18px_40px_-20px_rgba(90,80,90,0.35)] sm:p-7">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-body uppercase tracking-[0.28em] text-tangerine">
              New event
            </p>
            <h2 className="font-display display-wonk text-3xl font-light leading-tight text-foreground sm:text-4xl">
              Add to the schedule
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-text-secondary font-body">
            Create the date, time, location, and guest-facing details guests
            will see on their invitation.
          </p>
        </div>
        <form
          action={createEvent}
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <FormField
            label="Name"
            name="name"
            size="lg"
            required
            placeholder="Mehndi, Sangeet, Ceremony…"
          />
          <FormField
            label="Date"
            name="date"
            type="date"
            size="lg"
            required
          />
          <FormField label="Time" name="time" type="time" size="lg" required />
          <FormField label="Location (optional)" name="location" size="lg" />
          <FormField label="Dress code (optional)" name="dress_code" size="lg" />
          <TextareaField
            label="Details (optional)"
            name="details"
            size="lg"
            rows={3}
            labelClassName="md:col-span-2"
          />
          <div className="md:col-span-2">
            <Button type="submit" className="rounded-full px-7 py-3">
              Add event
            </Button>
          </div>
        </form>
      </section>

      {!events || events.length === 0 ? (
        <section className="rounded-[2rem] border border-white/70 bg-warm-white/65 px-6 py-10 text-center shadow-[0_14px_30px_-18px_rgba(90,80,90,0.35)]">
          <p className="font-display display-wonk text-3xl font-light text-foreground">
            No events yet.
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-text-secondary font-body">
            Add the first event above to start building the wedding schedule.
          </p>
        </section>
      ) : (
        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[11px] font-body uppercase tracking-[0.28em] text-text-secondary">
                Current schedule
              </p>
              <h2 className="font-display display-wonk text-3xl font-light leading-tight text-foreground sm:text-4xl">
                Events on the calendar
              </h2>
            </div>
          </div>
          {events.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </section>
      )}
    </div>
  );
}
