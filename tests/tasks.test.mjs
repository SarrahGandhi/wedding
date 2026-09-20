import assert from "node:assert/strict";
import test from "node:test";
import { parseTask, taskIdentity, formatTaskDate } from "../lib/tasks.ts";

function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ name: " Confirm menu ", owner: " Sarrah ", due_date: "2026-10-12", side: "BRIDE", ...overrides })) data.set(key, value);
  return data;
}

test("task forms trim names and persist both completion states", () => {
  assert.deepEqual(parseTask(form()).data, {
    name: "Confirm menu", owner: "Sarrah", due_date: "2026-10-12", completed: false, side: "BRIDE", notes: null,
  });
  assert.equal(parseTask(form({ completed: "on" })).data.completed, true);
  assert.ok(parseTask(form({ completed: "false" })).error);
  assert.equal(parseTask(form({ side: "GROOM" })).data.side, "GROOM");
  assert.equal(parseTask(form({ notes: "  Call the caterer\nConfirm vegetarian options  " })).data.notes,
    "Call the caterer\nConfirm vegetarian options");
  assert.equal(parseTask(form({ notes: " \n " })).data.notes, null);
  assert.ok(parseTask(form({ notes: new Blob(["file"]) })).error);
  for (const side of ["", "BOTH", "bride", "toString"]) {
    assert.ok(parseTask(form({ side })).error);
  }
});

test("task fields reject blank, oversized, missing, and file values", () => {
  for (const overrides of [{ name: " " }, { owner: " " }, { name: "a".repeat(161) }, { owner: "a".repeat(121) }, { name: new Blob(["file"]) }]) {
    assert.ok(parseTask(form(overrides)).error);
  }
  for (const field of ["name", "owner", "due_date", "side"]) {
    const data = form();
    data.delete(field);
    assert.ok(parseTask(data).error);
  }
});

test("due dates reject impossible dates but accept leap days and past dates", () => {
  for (const due_date of ["", "2026-02-29", "2026-02-30", "2026-04-31", "2026-13-01", "2026-1-1", "0000-01-01", "2026-10-12T00:00:00Z"]) {
    assert.ok(parseTask(form({ due_date })).error, due_date);
  }
  for (const due_date of ["2024-02-29", "2026-01-01", "0001-01-01", "9999-12-31"]) {
    assert.equal(parseTask(form({ due_date })).data.due_date, due_date);
  }
  assert.equal(formatTaskDate("2026-10-12"), "12 Oct 2026");
});

test("updates require a valid task ID and revision", () => {
  assert.equal(taskIdentity(form()), null);
  for (const value of ["", "0", "-1", "1.5", "Infinity", "9007199254740992"]) {
    assert.equal(taskIdentity(form({ id: value, revision: "1" })), null);
    assert.equal(taskIdentity(form({ id: "1", revision: value })), null);
  }
  assert.deepEqual(taskIdentity(form({ id: "2", revision: "3" })), { id: 2, revision: 3 });
});
