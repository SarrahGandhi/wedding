import assert from "node:assert/strict";
import test from "node:test";
import { categoryAmounts, parseAmounts, parseMoney, splitAmount, parseCategory, summarizeBudget, MAX_PAISE } from "../lib/budgeting.ts";

const category = (overrides = {}) => ({
  id: 1, name: "Venue", vendor: "Wedding Hall", notes: null,
  split_type: "EQUAL", total_paise: 10000, bride_share_paise: 5000,
  groom_share_paise: 5000, bride_paid_paise: 0, groom_paid_paise: 0,
  amounts_paise: null, revision: 1, created_at: "2026-09-18T00:00:00Z", ...overrides,
});

test("money uses exact paise and rejects malformed, negative and oversized amounts", () => {
  assert.equal(parseMoney("123456.78"), 12345678);
  assert.equal(parseMoney("0.29"), 29);
  assert.equal(parseMoney(" 10.1 "), 1010);
  assert.equal(parseMoney("0"), 0);
  assert.equal(parseMoney("999999999.99"), MAX_PAISE);
  for (const invalid of ["", "-1", "1.001", "1e3", "NaN", "Infinity", "1,000", "1000000000", null, 100]) {
    assert.equal(parseMoney(invalid), null, String(invalid));
  }
});

test("all split modes preserve the full total including an odd paise", () => {
  assert.deepEqual(splitAmount(10001, "GROOM"), { bride: 0, groom: 10001 });
  assert.deepEqual(splitAmount(10001, "BRIDE"), { bride: 10001, groom: 0 });
  assert.deepEqual(splitAmount(10001, "EQUAL"), { bride: 5000, groom: 5001 });
  assert.deepEqual(splitAmount(10001, "CUSTOM", 3000), { bride: 3000, groom: 7001 });
  assert.deepEqual(splitAmount(1, "EQUAL"), { bride: 0, groom: 1 });
  assert.deepEqual(splitAmount(0, "EQUAL"), { bride: 0, groom: 0 });
});

test("server validation computes shares, normalizes vendors and accepts payments on the other side’s behalf", () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: " Catering ", vendor: "  Good   Food  ", amount: "100.01", split_type: "CUSTOM", bride_share: "25", bride_paid: "80", groom_paid: "0" })) form.set(key, value);
  const parsed = parseCategory(form);
  assert.equal(parsed.error, undefined);
  assert.equal(parsed.data.vendor, "Good Food");
  assert.equal(parsed.data.name, "Catering");
  assert.equal(parsed.data.bride_share_paise, 2500);
  assert.equal(parsed.data.groom_share_paise, 7501);
  assert.equal(parsed.data.bride_paid_paise, 8000);
  form.set("bride_share", "101");
  assert.match(parseCategory(form).error, /between zero and the total/);
  form.set("split_type", "GROOM");
  assert.equal(parseCategory(form).data.bride_share_paise, 0);
  form.set("split_type", "toString");
  assert.match(parseCategory(form).error, /Choose how/);
  form.set("split_type", "BRIDE");
  form.set("groom_paid", "-5");
  assert.match(parseCategory(form).error, /non-negative/);
});

test("multiple amounts use exact paise and reject invalid rows or combined overflow", () => {
  assert.deepEqual(parseAmounts(["0.10", "0.20", "1.01"]), { amounts: [10, 20, 101], total: 131 });
  assert.deepEqual(parseAmounts(["0"]), { amounts: [0], total: 0 });
  for (const amounts of [[], ["1", ""], ["1", "-1"], ["1.001"], ["999999999.99", "0.01"], [new Blob(["1"])]]) {
    assert.equal(parseAmounts(amounts), null);
  }
  assert.deepEqual(categoryAmounts(category()), [10000]);
  assert.deepEqual(categoryAmounts(category({ amounts_paise: [1000, 9000] })), [1000, 9000]);
});

test("category totals and splits are computed from amounts, ignoring a supplied total", () => {
  const form = new FormData();
  for (const [key, value] of Object.entries({ name: "Venue", split_type: "EQUAL", bride_paid: "25", groom_paid: "10", total: "999" })) form.set(key, value);
  form.append("amount", "50");
  form.append("amount", "25.01");
  const parsed = parseCategory(form).data;
  assert.deepEqual(parsed.amounts_paise, [5000, 2501]);
  assert.equal(parsed.total_paise, 7501);
  assert.equal(parsed.bride_share_paise, 3750);
  assert.equal(parsed.groom_share_paise, 3751);
  assert.equal(parsed.bride_paid_paise, 2500);
  assert.equal(summarizeBudget([category(parsed)]).totals.outstanding, 4001);
  form.set("split_type", "CUSTOM");
  form.set("bride_share", "80");
  assert.match(parseCategory(form).error, /between zero and the total/);
  form.set("bride_share", "50");
  assert.equal(parseCategory(form).data.groom_share_paise, 2501);
  form.delete("amount");
  assert.match(parseCategory(form).error, /at least one/);
});

test("vendor grouping combines names without letting a credit hide another vendor’s balance", () => {
  const { totals, vendors } = summarizeBudget([
    category({ bride_paid_paise: 12000 }),
    category({ id: 2, vendor: " wedding   HALL ", total_paise: 4000, bride_share_paise: 2000, groom_share_paise: 2000 }),
    category({ id: 3, vendor: "Florist", groom_paid_paise: 15000 }),
    category({ id: 4, vendor: "Photographer" }),
  ]);
  assert.equal(vendors.length, 3);
  assert.equal(vendors.find((v) => v.name === "Wedding Hall").balance, 2000);
  assert.deepEqual(totals, { total: 34000, brideShare: 17000, groomShare: 17000, bridePaid: 12000, groomPaid: 15000, paid: 27000, outstanding: 12000, credit: 5000 });
  assert.equal(totals.total - totals.paid, totals.outstanding - totals.credit);
});

test("unassigned vendors stay separate and empty budgets have zero totals", () => {
  const { totals, vendors } = summarizeBudget([
    category({ vendor: null, bride_paid_paise: 15000 }),
    category({ id: 2, vendor: null }),
  ]);
  assert.equal(vendors.length, 2);
  assert.equal(totals.outstanding, 10000);
  assert.equal(totals.credit, 5000);
  assert.ok(Object.values(summarizeBudget([]).totals).every((value) => value === 0));
});
