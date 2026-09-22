import assert from "node:assert/strict";
import test from "node:test";
import { compareShoppingItems, parseShoppingListItem, shoppingListItemIdentity } from "../lib/shopping-list.ts";

function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    item: " Floral garlands ",
    store: " Chor Bazaar ",
    vendor: " Ali ",
    urgency: "MEDIUM",
    ...overrides,
  })) data.set(key, value);
  return data;
}

test("shopping forms trim fields and persist purchased state", () => {
  assert.deepEqual(parseShoppingListItem(form()).data, {
    item: "Floral garlands",
    store: "Chor Bazaar",
    vendor: "Ali",
    urgency: "MEDIUM",
    purchased: false,
  });
  assert.equal(parseShoppingListItem(form({ purchased: "on" })).data.purchased, true);
  assert.ok(parseShoppingListItem(form({ purchased: "false" })).error);
  assert.equal(parseShoppingListItem(form({ urgency: "HIGH" })).data.urgency, "HIGH");
});

test("shopping fields reject blank, oversized, and invalid values", () => {
  for (const overrides of [
    { item: " " },
    { store: " " },
    { vendor: " " },
    { item: "a".repeat(201) },
    { store: "a".repeat(161) },
    { vendor: "a".repeat(161) },
    { urgency: "CRITICAL" },
  ]) {
    assert.ok(parseShoppingListItem(form(overrides)).error);
  }
  for (const field of ["item", "store", "vendor", "urgency"]) {
    const data = form();
    data.delete(field);
    assert.ok(parseShoppingListItem(data).error);
  }
});

test("updates require a valid shopping item ID and revision", () => {
  assert.equal(shoppingListItemIdentity(form()), null);
  assert.deepEqual(shoppingListItemIdentity(form({ id: "2", revision: "3" })), { id: 2, revision: 3 });
});

test("shopping items sort by purchase status then urgency", () => {
  const base = { store: "S", vendor: "V", revision: 1, created_at: "" };
  const high = { id: 1, item: "A", urgency: "HIGH", purchased: false, ...base };
  const low = { id: 2, item: "B", urgency: "LOW", purchased: false, ...base };
  const bought = { id: 3, item: "C", urgency: "HIGH", purchased: true, ...base };
  assert.ok(compareShoppingItems(high, low) < 0);
  assert.ok(compareShoppingItems(high, bought) < 0);
  assert.ok(compareShoppingItems(bought, high) > 0);
});
