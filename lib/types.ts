import type { Enums } from "@/lib/supabase/database.types";

export type RsvpStatus = Enums<"event_rsvp_status">;
export type GuestSide = Enums<"guest_side">;
export type GuestCategory = Enums<"guest_category">;

export const RSVP_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "DECLINED",
] as const satisfies readonly RsvpStatus[];

export const GUEST_SIDES = [
  "BRIDE",
  "GROOM",
] as const satisfies readonly GuestSide[];

export const GUEST_CATEGORIES = [
  "MALE",
  "FEMALE",
  "CHILD",
] as const satisfies readonly GuestCategory[];
