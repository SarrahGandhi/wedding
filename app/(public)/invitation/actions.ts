"use server";

import { createClient } from "@/lib/supabase/server";
import type { GuestSide, RsvpStatus } from "@/lib/types";

export interface GuestResult {
  id: number;
  name: string;
  category: string;
  familyId: number | null;
}

export interface EventRsvp {
  rsvpId: number;
  eventId: number;
  eventName: string;
  eventDate: string;
  eventLocation: string | null;
  eventDressCode: string | null;
  eventDetails: string | null;
  guestId: number;
  guestName: string;
  status: RsvpStatus;
}

export interface FamilyInvitation {
  familyId: number;
  familySide: GuestSide;
  guests: GuestResult[];
  rsvps: EventRsvp[];
}

export async function searchGuests(name: string): Promise<GuestResult[]> {
  if (!name || name.trim().length < 2) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .select("id, name, category, family_id")
    .ilike("name", `%${name.trim()}%`)
    .limit(10);

  if (error) throw new Error("Failed to search guests");
  return (data ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    category: g.category,
    familyId: g.family_id,
  }));
}

export async function getFamilyInvitationByFamilyId(
  familyId: number
): Promise<FamilyInvitation | null> {
  const supabase = await createClient();

  const { data: family, error: familyError } = await supabase
    .from("guest_families")
    .select("id, side")
    .eq("id", familyId)
    .single();

  if (familyError || !family) return null;

  const { data: familyGuests } = await supabase
    .from("guests")
    .select("id, name, category")
    .eq("family_id", family.id)
    .order("id");

  const guestIds = (familyGuests ?? []).map((g) => g.id);

  const { data: rsvpRows } = await supabase
    .from("event_guests_rsvp")
    .select(
      `
      id,
      event_id,
      guest_id,
      rsvp_status,
      events (id, name, date, location, dress_code, details)
    `
    )
    .in("guest_id", guestIds)
    .order("event_id");

  const rsvps: EventRsvp[] = (rsvpRows ?? []).map((row) => {
    const event = row.events as unknown as {
      id: number;
      name: string;
      date: string;
      location: string | null;
      dress_code: string | null;
      details: string | null;
    };
    return {
      rsvpId: row.id,
      eventId: event.id,
      eventName: event.name,
      eventDate: event.date,
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
    familySide: family.side,
    guests: (familyGuests ?? []).map((g) => ({
      ...g,
      familyId: family.id,
    })),
    rsvps,
  };
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
