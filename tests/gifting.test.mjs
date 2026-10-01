import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { parseGiftPlan, moveEntry } from "../lib/gifting.ts";

const plan = () => [{ id: randomUUID(), name: " Mum ", categories: [{ id: randomUUID(), name: " Hamper ", creatives: " Flowers for decoration ", gifts: [{ id: randomUUID(), name: " Scarf " }, { id: randomUUID(), name: " Perfume " }] }] }];

test("preserves recipient/category/gift order and category-level creative requirements", () => {
  const source = plan();
  source[0].categories[0].gifts = moveEntry(source[0].categories[0].gifts, 1, -1);
  const parsed = parseGiftPlan(source);
  assert.equal(parsed[0].name, "Mum");
  assert.equal(parsed[0].categories[0].creatives, "Flowers for decoration");
  assert.deepEqual(parsed[0].categories[0].gifts.map(gift => gift.name), ["Perfume", "Scarf"]);
  assert.equal("creatives" in parsed[0].categories[0].gifts[0], false);
  assert.deepEqual(parseGiftPlan([]), []);
});

test("rejects missing names, duplicate identities, invalid shapes, and excessive notes", () => {
  for (const mutate of [
    p => { p[0].name = " "; },
    p => { p[0].categories[0].name = ""; },
    p => { p[0].categories[0].gifts[0].name = ""; },
    p => { p[0].categories[0].id = p[0].id; },
    p => { p[0].categories[0].creatives = "x".repeat(5001); },
    p => { p[0].categories = null; },
  ]) {
    const value = plan(); mutate(value); assert.throws(() => parseGiftPlan(value));
  }
  assert.throws(() => parseGiftPlan(null));
});

test("reordering handles boundaries without mutating original arrays", () => {
  const original = ["a", "b", "c"];
  assert.deepEqual(moveEntry(original, 0, 1), ["b", "a", "c"]);
  assert.deepEqual(moveEntry(original, 2, -1), ["a", "c", "b"]);
  assert.deepEqual(moveEntry(original, 0, -1), original);
  assert.deepEqual(moveEntry(original, 2, 1), original);
  assert.deepEqual(original, ["a", "b", "c"]);
});

test("older plans default to Awaiting without losing their content", () => {
  const source = plan();
  const parsed = parseGiftPlan(source);
  assert.equal(parsed[0].categories[0].status, "Awaiting");
  assert.ok(parsed[0].categories[0].gifts.every(gift => gift.status === "Awaiting"));
  assert.equal(parsed[0].categories[0].creatives, "Flowers for decoration");
  assert.equal(source[0].categories[0].status, undefined);
});

test("gift and category statuses persist independently through a save round trip", () => {
  for (const categoryStatus of ["Awaiting", "Pending", "Completed"]) {
    for (const giftStatus of ["Awaiting", "Received"]) {
      const source = plan();
      source[0].categories[0].status = categoryStatus;
      source[0].categories[0].gifts[0].status = giftStatus;
      const parsed = parseGiftPlan(JSON.parse(JSON.stringify(parseGiftPlan(source))));
      assert.equal(parsed[0].categories[0].status, categoryStatus);
      assert.equal(parsed[0].categories[0].gifts[0].status, giftStatus);
    }
  }
});

test("rejects statuses from the wrong level and invalid values", () => {
  for (const status of ["Completed", "Pending", "received", "", null, 1]) {
    const source = plan(); source[0].categories[0].gifts[0].status = status;
    assert.throws(() => parseGiftPlan(source), /valid status/);
  }
  for (const status of ["Received", "completed", "", null, 1]) {
    const source = plan(); source[0].categories[0].status = status;
    assert.throws(() => parseGiftPlan(source), /valid status/);
  }
});
