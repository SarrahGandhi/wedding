import type { GuestCategory } from "./types";

export function remainingGuestSlots(
  family: { male_guest_slots: number; female_guest_slots: number },
  guests: readonly { category: GuestCategory }[],
) {
  return {
    remainingMaleSlots: Math.max(0, family.male_guest_slots - guests.filter((guest) => guest.category === "MALE").length),
    remainingFemaleSlots: Math.max(0, family.female_guest_slots - guests.filter((guest) => guest.category === "FEMALE").length),
  };
}
