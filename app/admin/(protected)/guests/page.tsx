import { createClient } from "@/lib/supabase/server";
import { GuestsWorkspace } from "./GuestsWorkspace";
import { familyLabel } from "./family-label";
import type { GuestCategory } from "@/lib/types";
import { PageHeader } from "@/app/shared/PageHeader";

type Guest = {
  id: number;
  name: string;
  category: GuestCategory;
  family_id: number;
  added_by_family: boolean;
};

function familyLabelFromGuests(
  guests: Guest[],
  familyId: number,
  familyName: string | null,
): string {
  return familyLabel(
    [...guests].sort((a, b) => a.id - b.id).map((g) => g.name),
    familyId,
    familyName,
  );
}

export default async function GuestsPage() {
  const supabase = await createClient();

  const [{ data: families }, { data: guestRows }] = await Promise.all([
    supabase
      .from("guest_families")
      .select(
        "id, side, email, phone, family_name, male_guest_slots, female_guest_slots, allow_all_guests",
      )
      .order("id", { ascending: true }),
    supabase
      .from("guests")
      .select("id, name, category, family_id, added_by_family")
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

  const toEntry = (f: (typeof families extends (infer T)[] | null ? T : never)) => ({
    family: {
      ...f,
      side: f.side as "BRIDE" | "GROOM",
    },
    guests: guestsByFamily.get(f.id) ?? [],
    label: familyLabelFromGuests(
      guestsByFamily.get(f.id) ?? [],
      f.id,
      f.family_name,
    ),
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

      <GuestsWorkspace
        brideFamilies={brideFamilies}
        groomFamilies={groomFamilies}
      />
    </div>
  );
}
