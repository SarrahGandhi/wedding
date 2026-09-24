import assert from "node:assert/strict";
import test from "node:test";
import { attendingGuestsByFamily } from "../lib/logistics-attendance.ts";
import { groupByAccommodation } from "../lib/logistics.ts";

const guests = [
  { id: 1, name: "Amina", family_id: 10 },
  { id: 2, name: "Ali", family_id: 10 },
  { id: 3, name: "Zain", family_id: 10 },
];

test("two yes replies and one no in a family of three count as two accommodation guests", () => {
  const attending = attendingGuestsByFamily(guests, [
    { guest_id: 1, rsvp_status: "ACCEPTED" },
    { guest_id: 2, rsvp_status: "ACCEPTED" },
    { guest_id: 3, rsvp_status: "DECLINED" },
  ]);
  assert.deepEqual(attending.get(10), [{ id: 1, name: "Amina" }, { id: 2, name: "Ali" }]);
  const groups = groupByAccommodation([{
    id: 10, label: "Family", side: "BRIDE", guests: attending.get(10), logistics: null,
    accommodation: { id: 1, kind: "HOTEL", name: "Lake Hotel", room_number: "201" },
  }]);
  assert.equal(groups[0].families.reduce((sum, family) => sum + family.guests.length, 0), 2);
});

test("count each person once across events; a yes to another event still means attending", () => {
  const attending = attendingGuestsByFamily(guests, [
    { guest_id: 1, rsvp_status: "ACCEPTED" },
    { guest_id: 1, rsvp_status: "ACCEPTED" },
    { guest_id: 1, rsvp_status: "DECLINED" },
    { guest_id: 2, rsvp_status: "PENDING" },
    { guest_id: 3, rsvp_status: "DECLINED" },
  ]);
  assert.deepEqual(attending.get(10), [{ id: 1, name: "Amina" }]);
});

test("changing the last yes to no removes the guest and all-no families have no accommodation count", () => {
  const replies = [{ guest_id: 1, rsvp_status: "ACCEPTED" }, { guest_id: 2, rsvp_status: "DECLINED" }];
  assert.equal(attendingGuestsByFamily(guests, replies).get(10).length, 1);
  replies[0].rsvp_status = "DECLINED";
  assert.equal(attendingGuestsByFamily(guests, replies).has(10), false);
});
