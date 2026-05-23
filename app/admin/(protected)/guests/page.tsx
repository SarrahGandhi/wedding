import { createClient } from "@/lib/supabase/server";
import { AddFamilyForm } from "./AddFamilyForm";
import { GuestRoster } from "./GuestRoster";
import type { GuestCategory } from "@/lib/types";
import { PageHeader } from "@/app/shared/PageHeader";

type Guest = {
  id: number;
  name: string;
  category: GuestCategory;
  family_id: number;
};

function familyLabelFromGuests(guests: Guest[], familyId: number): string {
  if (guests.length === 0) return `Empty family · #${familyId}`;
  return guests
    .sort((a, b) => a.id - b.id)
    .map((g) => g.name)
    .join(", ");
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
      .order("id", { ascending: true }),
  ]);

  const guests: Guest[] = (guestRows ?? [])
    .filter((g): g is Guest => g.family_id != null)
    .map((g) => ({ ...g, family_id: g.family_id as number }));

  const guestsByFamily = new Map<number, Guest[]>();
  for (const g of guests) {
    const list = guestsByFamily.get(g.family_id) ?? [];
    list.push(g);
    guestsByFamily.set(g.family_id, list);
  }

  const toEntry = (f: { id: number; side: string; email: string[]; phone: string | null }) => ({
    family: f as { id: number; side: "BRIDE" | "GROOM"; email: string[]; phone: string | null },
    guests: guestsByFamily.get(f.id) ?? [],
    label: familyLabelFromGuests(guestsByFamily.get(f.id) ?? [], f.id),
  });

  const brideFamilies = (families ?? []).filter((f) => f.side === "BRIDE").map(toEntry);
  const groomFamilies = (families ?? []).filter((f) => f.side === "GROOM").map(toEntry);

  return (
    <div className="animate-fade-up">
      <PageHeader
        chapter="Chapter I"
        title="Roster."
        meta={
          <>
            {guests.length} {guests.length === 1 ? "guest" : "guests"} across{" "}
            {families?.length ?? 0}{" "}
            {(families?.length ?? 0) === 1 ? "family" : "families"}
          </>
        }
      />

      <section className="mb-12 border-t border-b border-border/40 py-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-2">
          New family
        </p>
        <p className="text-xs text-text-secondary font-body italic mb-4 leading-relaxed">
          Create the family first; add its guests inside the section that
          appears below. Emails are optional — guests can fill them in
          themselves later.
        </p>
        <AddFamilyForm />
      </section>

      {!families || families.length === 0 ? (
        <p className="text-sm text-text-secondary font-body italic">
          No families yet — start by adding one above.
        </p>
      ) : (
        <GuestRoster
          brideFamilies={brideFamilies}
          groomFamilies={groomFamilies}
        />
      )}
    </div>
  );
}
