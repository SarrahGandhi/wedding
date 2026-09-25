import assert from "node:assert/strict";
import { test } from "node:test";
import { accommodationLabel, accommodationOptions, formatArrival, groupByAccommodation, matchesFamily, parseLogisticsForm, sortAccommodationFamilies, travelSummary } from "../lib/logistics.ts";

function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries({ family_id: "1", ...values })) data.set(key, value);
  return data;
}

test("house and hotel rooms are optional and retain supplied room numbers", () => {
  for (const kind of ["HOUSE", "HOTEL"]) {
    for (const room of ["", "   ", "12A"]) {
      const hotel = parseLogisticsForm(form({ accommodation_id: "new", new_kind: kind, new_name: "Lake stay", room_number: room }));
      assert.equal(hotel.data.p_new_room_number, room.trim() || null);
    }
    assert.match(parseLogisticsForm(form({ accommodation_id: "new", new_kind: kind, new_name: "Lake stay", room_number: "1".repeat(41) })).error, /room number/);
  }
  const house = parseLogisticsForm(form({ accommodation_id: "new", new_kind: "HOUSE", new_name: "  Gandhi   house ", room_number: "201" }));
  assert.equal(house.data.p_new_room_number, "201");
  assert.equal(house.data.p_new_name, "Gandhi house");
});

test("travel numbers are trimmed and only saved for the selected mode", () => {
  const numbers = { train_number: " 01234 ", coach_number: " B2 ", flight_number: " AI 101 " };
  for (const mode of ["TRAIN", "FLIGHT", "CAR", "BUS", "OTHER", ""]) {
    const { data } = parseLogisticsForm(form({ travel_mode: mode, ...numbers }));
    assert.equal(data.p_train_number, mode === "TRAIN" ? "01234" : null);
    assert.equal(data.p_coach_number, mode === "TRAIN" ? "B2" : null);
    assert.equal(data.p_flight_number, mode === "FLIGHT" ? "AI 101" : null);
  }
  for (const [mode, field] of [["TRAIN", "train_number"], ["TRAIN", "coach_number"], ["FLIGHT", "flight_number"]]) {
    assert.match(parseLogisticsForm(form({ travel_mode: mode, [field]: "1".repeat(41) })).error, /40 characters/);
    assert.equal(parseLogisticsForm(form({ travel_mode: mode, [field]: "  " })).data[`p_${field}`], null);
  }
  assert.equal(travelSummary({ travel_mode: "TRAIN", train_number: "01234", coach_number: "B2" }), "Train 01234 · Coach B2");
  assert.equal(travelSummary({ travel_mode: "FLIGHT", flight_number: "AI 101" }), "Flight · AI 101");
  assert.equal(travelSummary(null), "Travel not set");
});

test("existing shared stays are selected by ID and assignments can be cleared", () => {
  const existing = parseLogisticsForm(form({ accommodation_id: "12", room_number: " 302 ", new_kind: "HOTEL", new_name: "ignored" }));
  assert.equal(existing.data.p_accommodation_id, 12);
  assert.equal(existing.data.p_new_kind, null);
  assert.equal(existing.data.p_new_room_number, "302");
  assert.equal(parseLogisticsForm(form({ accommodation_id: "12", room_number: "" })).data.p_new_room_number, null);
  assert.match(parseLogisticsForm(form({ accommodation_id: "12", room_number: "1".repeat(41) })).error, /room number/);
  assert.equal(parseLogisticsForm(form({ accommodation_id: "" })).data.p_accommodation_id, null);
});

test("partial travel plans are allowed but invalid input is rejected", () => {
  assert.equal(parseLogisticsForm(form({})).data.p_travel_mode, null);
  for (const values of [
    { family_id: "-1" }, { family_id: "1.5" }, { accommodation_id: "0" },
    { travel_mode: "BOAT" }, { arrival_date: "2026-02-30" }, { arrival_date: "tomorrow" },
    { accommodation_id: "new", new_kind: "HOUSE", new_name: " " },
  ]) assert.ok(parseLogisticsForm(form(values)).error);
  assert.equal(parseLogisticsForm(form({ arrival_date: "2028-02-29" })).data.p_arrival_date, "2028-02-29");
});

const stay = (id, name, room_number, kind = "HOTEL") => ({ id, name, room_number, kind, created_at: "2026-09-18" });
const family = (id, label, accommodation, arrival_date = null) => ({
  id, label, side: "BRIDE", guests: [{ id, name: label }], accommodation,
  logistics: { family_id: id, travel_mode: null, travel_details: null, arrival_date, accommodation_id: accommodation?.id ?? null },
});
const families = [
  family(1, "Zara", stay(1, "Lake Hotel", "10"), "2026-10-10"),
  family(2, "Amina", stay(2, "lake hotel", "2"), "2026-10-09"),
  family(3, "Bilal", stay(2, "lake hotel", "2")),
  family(4, "Dawood", stay(3, "Lake Hotel", null, "HOUSE")),
  family(5, "Fatima", null),
  family(6, "Hassan", stay(4, "Other Hotel", "2")),
];

test("existing accommodation lists each hotel once without including rooms", () => {
  const entries = families.flatMap((family) => family.accommodation ? [family.accommodation] : []);
  entries.push(stay(5, " LAKE HOTEL ", null));
  const options = accommodationOptions(entries);
  assert.equal(options.length, 3);
  assert.deepEqual(options.find((property) => property.id === 1), { id: 1, name: "Lake Hotel", kind: "HOTEL" });
  assert.ok(options.every((property) => !("room_number" in property)));
  assert.deepEqual(accommodationOptions([...entries].reverse()), options);
});

test("all rooms in a hotel stay together; same-named houses remain separate", () => {
  const groups = groupByAccommodation(families);
  assert.equal(groups.length, 3);
  assert.equal(groups.find((group) => group.key === "HOTEL:lake hotel").families.length, 3);
  assert.equal(groups.find((group) => group.kind === "HOUSE").families.length, 1);
});

test("room sorting is numeric and shared rooms remain adjacent", () => {
  assert.deepEqual(sortAccommodationFamilies(families.slice(0, 3), "room").map((f) => f.id), [2, 3, 1]);
  assert.deepEqual(sortAccommodationFamilies(families.slice(0, 3), "arrival").map((f) => f.id), [2, 1, 3]);
  assert.deepEqual(families.slice(0, 3).map((f) => f.id), [1, 2, 3]);
});

test("hotels without room numbers remain grouped and sort after assigned rooms", () => {
  const unassigned = family(7, "Aaliyah", stay(5, "Lake Hotel", null));
  const entries = [unassigned, ...families.slice(0, 3)];
  assert.equal(groupByAccommodation(entries).length, 1);
  assert.deepEqual(sortAccommodationFamilies(entries, "room").map((f) => f.id), [2, 3, 1, 7]);
  assert.equal(accommodationLabel(unassigned.accommodation), "Lake Hotel · Room not assigned");
});

test("house rooms are displayed, grouped and sorted with unassigned rooms last", () => {
  const entries = [family(1, "A", stay(10, "Gandhi house", "10", "HOUSE")),
    family(2, "B", stay(11, "Gandhi house", "2", "HOUSE")),
    family(3, "C", stay(12, "Gandhi house", null, "HOUSE"))];
  assert.equal(groupByAccommodation(entries).length, 1);
  assert.equal(accommodationOptions(entries.map((f) => f.accommodation)).length, 1);
  assert.deepEqual(sortAccommodationFamilies(entries, "room").map((f) => f.id), [2, 1, 3]);
  assert.equal(accommodationLabel(entries[0].accommodation), "Gandhi house · House · Room 10");
  assert.equal(accommodationLabel(entries[2].accommodation), "Gandhi house · House");
});

test("search covers guests, accommodation and room; dates do not shift time zones", () => {
  assert.ok(matchesFamily(families[0], "lake 10"));
  assert.ok(matchesFamily(families[0], "ZARA"));
  assert.ok(!matchesFamily(families[4], "lake"));
  assert.equal(formatArrival("2026-10-10"), "10 Oct 2026");
  assert.equal(accommodationLabel(families[0].accommodation), "Lake Hotel · Room 10");
});
