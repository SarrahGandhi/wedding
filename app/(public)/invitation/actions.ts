"use server";

import { createClient } from "@/lib/supabase/server";
import {
  GUEST_CATEGORIES,
  type GuestCategory,
  type GuestSide,
  type RsvpStatus,
} from "@/lib/types";

export interface GuestResult {
  id: number;
  name: string;
  category: GuestCategory;
  familyId: number;
}

export interface EventRsvp {
  rsvpId: number;
  eventId: number;
  eventName: string;
  eventDate: string;
  eventTime: string | null;
  eventLocation: string | null;
  eventDressCode: string | null;
  eventDetails: string | null;
  guestId: number;
  guestName: string;
  status: RsvpStatus;
}

export interface FamilyInvitation {
  familyId: number;
  familyName: string | null;
  familySide: GuestSide;
  allowAllGuests: boolean;
  remainingMaleSlots: number;
  remainingFemaleSlots: number;
  guests: GuestResult[];
  rsvps: EventRsvp[];
}

export interface FamilySearchHit {
  familyId: number;
  familyName: string | null;
  matchedGuestName: string | null;
  /** Names already on this invitation, in id order. */
  party: string[];
}

export async function searchGuests(name: string): Promise<FamilySearchHit[]> {
  if (!name || name.trim().length < 2) return [];

  const supabase = await createClient();
  const term = `%${name.trim()}%`;
  const [{ data: guestHits, error: guestError }, { data: familyHits, error: familyError }] =
    await Promise.all([
      supabase
        .from("guests")
        .select("name, family_id")
        .ilike("name", term)
        .limit(10),
      supabase
        .from("guest_families")
        .select("id, family_name")
        .ilike("family_name", term)
        .limit(10),
    ]);

  if (guestError || familyError) throw new Error("Failed to search invitations");

  const matchedGuestByFamily = new Map<number, string>();
  for (const guest of guestHits ?? []) {
    if (!matchedGuestByFamily.has(guest.family_id)) {
      matchedGuestByFamily.set(guest.family_id, guest.name);
    }
  }

  const familyNameById = new Map<number, string | null>();
  for (const family of familyHits ?? []) {
    familyNameById.set(family.id, family.family_name);
  }

  const familyIds = [
    ...new Set([
      ...(familyHits ?? []).map((family) => family.id),
      ...(guestHits ?? []).map((guest) => guest.family_id),
    ]),
  ].slice(0, 10);

  const missingFamilyIds = familyIds.filter((id) => !familyNameById.has(id));
  if (missingFamilyIds.length > 0) {
    const { data: missingFamilies, error } = await supabase
      .from("guest_families")
      .select("id, family_name")
      .in("id", missingFamilyIds);
    if (error) throw new Error("Failed to search invitations");
    for (const family of missingFamilies ?? []) {
      familyNameById.set(family.id, family.family_name);
    }
  }

  const partyByFamily = new Map<number, string[]>();
  if (familyIds.length > 0) {
    const { data: members } = await supabase
      .from("guests")
      .select("name, family_id")
      .in("family_id", familyIds)
      .order("id");

    for (const member of members ?? []) {
      const party = partyByFamily.get(member.family_id) ?? [];
      party.push(member.name);
      partyByFamily.set(member.family_id, party);
    }
  }

  return familyIds.map((familyId) => ({
    familyId,
    familyName: familyNameById.get(familyId) ?? null,
    matchedGuestName: matchedGuestByFamily.get(familyId) ?? null,
    party: partyByFamily.get(familyId) ?? [],
  }));
}

export async function getFamilyInvitationByFamilyId(
  familyId: number
): Promise<FamilyInvitation | null> {
  const supabase = await createClient();

  const { data: family, error: familyError } = await supabase
    .from("guest_families")
    .select(
      "id, side, family_name, male_guest_slots, female_guest_slots, allow_all_guests",
    )
    .eq("id", familyId)
    .single();

  if (familyError || !family) return null;

  const { data: familyGuests } = await supabase
    .from("guests")
    .select("id, name, category, added_by_family")
    .eq("family_id", family.id)
    .order("id");

  const guestIds = (familyGuests ?? []).map((g) => g.id);

  const { data: rsvpRows } =
    guestIds.length > 0
      ? await supabase
          .from("event_guests_rsvp")
          .select(
            `
            id,
            event_id,
            guest_id,
            rsvp_status,
            events (id, name, date, time, location, dress_code, details)
          `,
          )
          .in("guest_id", guestIds)
          .order("event_id")
      : { data: [] };

  const rsvps: EventRsvp[] = (rsvpRows ?? []).map((row) => {
    const event = row.events as unknown as {
      id: number;
      name: string;
      date: string;
      time: string | null;
      location: string | null;
      dress_code: string | null;
      details: string | null;
    };
    return {
      rsvpId: row.id,
      eventId: event.id,
      eventName: event.name,
      eventDate: event.date,
      eventTime: event.time,
      eventLocation: event.location,
      eventDressCode: event.dress_code,
      eventDetails: event.details,
      guestId: row.guest_id,
      guestName:
        (familyGuests ?? []).find((g) => g.id === row.guest_id)?.name ?? "",
      status: row.rsvp_status,
    };
  });

  return {
    familyId: family.id,
    familyName: family.family_name,
    familySide: family.side,
    allowAllGuests: family.allow_all_guests,
    remainingMaleSlots: Math.max(
      0,
      family.male_guest_slots -
        (familyGuests ?? []).filter(
          (guest) => guest.added_by_family && guest.category === "MALE",
        ).length,
    ),
    remainingFemaleSlots: Math.max(
      0,
      family.female_guest_slots -
        (familyGuests ?? []).filter(
          (guest) => guest.added_by_family && guest.category === "FEMALE",
        ).length,
    ),
    guests: (familyGuests ?? []).map((g) => ({
      ...g,
      familyId: family.id,
    })),
    rsvps,
  };
}

export async function addFamilyGuests(
  familyId: number,
  guests: { name: string; category: GuestCategory }[],
): Promise<{ success: boolean; error?: string }> {
  if (!Number.isInteger(familyId) || familyId <= 0) {
    return { success: false, error: "This invitation could not be found." };
  }
  if (guests.length === 0 || guests.length > 20) {
    return {
      success: false,
      error: "Add between 1 and 20 guests at a time.",
    };
  }

  const normalized = guests.map((guest) => ({
    name: guest.name.trim(),
    category: guest.category,
  }));
  if (
    normalized.some(
      (guest) =>
        !guest.name ||
        guest.name.length > 100 ||
        !GUEST_CATEGORIES.includes(guest.category),
    )
  ) {
    return { success: false, error: "Enter a valid name for every guest." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_family_guests", {
    family_row_id: familyId,
    guest_names: normalized.map((guest) => guest.name),
    guest_categories: normalized.map((guest) => guest.category),
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getFamilyInvitation(
  guestId: number
): Promise<FamilyInvitation | null> {
  const supabase = await createClient();

  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .select("family_id")
    .eq("id", guestId)
    .single();

  if (guestError || !guest?.family_id) return null;
  return getFamilyInvitationByFamilyId(guest.family_id);
}

export async function updateRsvpStatus(
  rsvpId: number,
  status: RsvpStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("event_guests_rsvp")
    .update({ rsvp_status: status })
    .eq("id", rsvpId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateRsvpStatusBulk(
  rsvpIds: number[],
  status: RsvpStatus
): Promise<{ success: boolean; error?: string }> {
  if (rsvpIds.length === 0) return { success: true };

  const supabase = await createClient();

  const { error } = await supabase
    .from("event_guests_rsvp")
    .update({ rsvp_status: status })
    .in("id", rsvpIds);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function addFamilyEmail(
  familyId: number,
  email: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { success: false, error: "Please enter a valid email address" };
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("append_family_email", {
    family_row_id: familyId,
    new_email: trimmed,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}
