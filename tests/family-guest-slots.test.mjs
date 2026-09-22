import assert from "node:assert/strict";
import test from "node:test";
import { remainingGuestSlots } from "../lib/family-guest-slots.ts";

test("fixed totals subtract both admin-entered and family-entered names", () => {
  const guests = [
    { name: "Admin male", category: "MALE", added_by_family: false },
    { name: "Admin female", category: "FEMALE", added_by_family: false },
    { name: "Family female", category: "FEMALE", added_by_family: true },
  ];
  assert.deepEqual(remainingGuestSlots({ male_guest_slots: 2, female_guest_slots: 3 }, guests), {
    remainingMaleSlots: 1, remainingFemaleSlots: 1,
  });
});

test("full or overfilled categories have no remaining slots without reducing other categories", () => {
  assert.deepEqual(remainingGuestSlots({ male_guest_slots: 0, female_guest_slots: 2 }, [
    { category: "MALE" }, { category: "FEMALE" }, { category: "CHILD" },
  ]), { remainingMaleSlots: 0, remainingFemaleSlots: 1 });
  assert.deepEqual(remainingGuestSlots({ male_guest_slots: 1, female_guest_slots: 1 }, [
    { category: "MALE" }, { category: "FEMALE" },
  ]), { remainingMaleSlots: 0, remainingFemaleSlots: 0 });
});

test("empty invitations retain their full allowance", () => {
  assert.deepEqual(remainingGuestSlots({ male_guest_slots: 2, female_guest_slots: 3 }, []), {
    remainingMaleSlots: 2, remainingFemaleSlots: 3,
  });
});
