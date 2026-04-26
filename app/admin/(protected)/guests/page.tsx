import { createClient } from "@/lib/supabase/server";
import { createFamily } from "./actions";
import { FamilySection } from "./FamilySection";

type Guest = {
  id: number;
  name: string;
  category: "MALE" | "FEMALE" | "CHILD";
  family_id: number;
};

function familyLabelFromGuests(guests: Guest[], familyId: number): string {
  if (guests.length === 0) return `Empty family · #${familyId}`;
  return guests.map((g) => g.name).join(", ");
}

export default async function GuestsPage() {
  const supabase = await createClient();

  const [{ data: families }, { data: guestRows }] = await Promise.all([
    supabase
      .from("guest_families")
      .select("id, side, email, phone")
      .order("id", { ascending: true }),
    supabase
      .from("guests")
      .select("id, name, category, family_id")
      .order("name", { ascending: true }),
  ]);

  // Treat any guest with a missing family_id as belonging to the unknown bucket.
  // This is defensive; after the NOT NULL migration this branch is unreachable.
  const guests: Guest[] = (guestRows ?? [])
    .filter((g): g is Guest => g.family_id != null)
    .map((g) => ({ ...g, family_id: g.family_id as number }));

  // Group guests by family.
  const guestsByFamily = new Map<number, Guest[]>();
  for (const g of guests) {
    const list = guestsByFamily.get(g.family_id) ?? [];
    list.push(g);
    guestsByFamily.set(g.family_id, list);
  }

  // Compute display label for each family from its guest names.
  const familyOptions = (families ?? []).map((f) => ({
    id: f.id,
    side: f.side,
    label: familyLabelFromGuests(guestsByFamily.get(f.id) ?? [], f.id),
  }));

  // Group families by side for nicer reading order.
  const brideFamilies = (families ?? []).filter((f) => f.side === "BRIDE");
  const groomFamilies = (families ?? []).filter((f) => f.side === "GROOM");

  return (
    <div className="animate-fade-up">
      <header className="mb-10 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-2">
            Chapter I
          </p>
          <h1 className="font-display italic text-5xl font-light text-foreground leading-none">
            Roster.
          </h1>
        </div>
        <p className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body tabular-nums">
          {guests.length}{" "}
          {guests.length === 1 ? "guest" : "guests"} across{" "}
          {families?.length ?? 0}{" "}
          {(families?.length ?? 0) === 1 ? "family" : "families"}
        </p>
      </header>

      {/* Add family form */}
      <section className="mb-12 border-t border-b border-border/40 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-2">
          New family
        </p>
        <p className="text-xs text-text-secondary font-body italic mb-4 leading-relaxed">
          Create the family first; add its guests inside the section that
          appears below. Emails are optional — guests can fill them in
          themselves later.
        </p>
        <form
          action={createFamily}
          className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3 items-end"
        >
          <label className="block">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Emails (optional)
            </span>
            <input
              name="emails"
              placeholder="alice@example.com, bob@example.com"
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
            />
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Side
            </span>
            <select
              name="side"
              defaultValue="BRIDE"
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
            >
              <option value="BRIDE">Bride</option>
              <option value="GROOM">Groom</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Phone (optional)
            </span>
            <input
              name="phone"
              placeholder="+1 555 0100"
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
            />
          </label>
          <button
            type="submit"
            className="px-5 py-2 bg-foreground text-background text-[10px] tracking-[0.3em] uppercase font-body hover:bg-accent transition-colors cursor-pointer"
          >
            Add family
          </button>
        </form>
      </section>

      {/* Families grouped by side */}
      {!families || families.length === 0 ? (
        <p className="text-sm text-text-secondary font-body italic">
          No families yet — start by adding one above.
        </p>
      ) : (
        <>
          {brideFamilies.length > 0 && (
            <section className="mb-12">
              <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-2">
                Bride&apos;s side
              </p>
              <div className="w-10 h-px bg-accent/40 mb-2" />
              {brideFamilies.map((f) => (
                <FamilySection
                  key={f.id}
                  family={f}
                  guests={guestsByFamily.get(f.id) ?? []}
                  familyOptions={familyOptions}
                  label={
                    familyOptions.find((o) => o.id === f.id)?.label ??
                    `Family · #${f.id}`
                  }
                />
              ))}
            </section>
          )}

          {groomFamilies.length > 0 && (
            <section>
              <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-2">
                Groom&apos;s side
              </p>
              <div className="w-10 h-px bg-accent/40 mb-2" />
              {groomFamilies.map((f) => (
                <FamilySection
                  key={f.id}
                  family={f}
                  guests={guestsByFamily.get(f.id) ?? []}
                  familyOptions={familyOptions}
                  label={
                    familyOptions.find((o) => o.id === f.id)?.label ??
                    `Family · #${f.id}`
                  }
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
