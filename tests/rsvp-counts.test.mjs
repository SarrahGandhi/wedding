import assert from "node:assert/strict";
import test from "node:test";
import { allRows } from "../lib/supabase/all-rows.ts";
import { confirmedGuestCount } from "../lib/rsvp-counts.ts";

test("counts people individually and only once across events", () => {
  assert.equal(confirmedGuestCount([
    { guest_id: 1, rsvp_status: "ACCEPTED" },
    { guest_id: 1, rsvp_status: "ACCEPTED" },
    { guest_id: 1, rsvp_status: "DECLINED" },
    { guest_id: 2, rsvp_status: "ACCEPTED" },
    { guest_id: 3, rsvp_status: "PENDING" },
    { guest_id: 4, rsvp_status: "DECLINED" },
  ]), 2);
  assert.equal(confirmedGuestCount([]), 0);
});

test("includes confirmations beyond the first 1,000 RSVP records", async () => {
  const replies = Array.from({ length: 2010 }, (_, id) => ({
    guest_id: id, event_id: 1, rsvp_status: id < 995 ? "PENDING" : "ACCEPTED",
  }));
  const ranges = [];
  const loaded = await allRows(async (from, to) => {
    ranges.push([from, to]);
    return { data: replies.slice(from, to + 1), error: null };
  });
  assert.equal(confirmedGuestCount(replies.slice(0, 1000)), 5);
  assert.equal(confirmedGuestCount(loaded), 1015);
  assert.deepEqual(ranges, [[0, 999], [1000, 1999], [2000, 2999]]);
});

test("does not show partial counts when a later page fails", async () => {
  await assert.rejects(allRows(async (from) => from === 0
    ? { data: Array(1000).fill({}), error: null }
    : { data: null, error: { message: "Unable to load replies" } }), /Unable to load replies/);
});
