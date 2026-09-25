import assert from "node:assert/strict";
import { test } from "node:test";
import { accommodationLabel, accommodationOptions, arrivalSupportSummary, earliestArrival, familyArrivals, formatArrival, formatArrivalDateTime, groupArrivalsByTime, groupByAccommodation, hasIncompleteArrival, matchesFamily, needsArrivalSupport, parseArrivalPlans, parseDepartureForm, parseLogisticsForm, sortAccommodationFamilies, sortLogisticsFamilies, travelSummary } from "../lib/logistics.ts";

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

test("pickup names are optional, trimmed, and can be cleared", () => {
  assert.equal(parseLogisticsForm(form({})).data.p_pickup_by, null);
  for (const pickup_by of ["", "   "]) {
    assert.equal(parseLogisticsForm(form({ pickup_by })).data.p_pickup_by, null);
  }
  const parsed = parseLogisticsForm(form({ pickup_by: "  Ali   Khan ", travel_mode: "CAR", accommodation_id: "12" }));
  assert.equal(parsed.data.p_pickup_by, "Ali Khan");
  assert.equal(parsed.data.p_travel_mode, "CAR");
  assert.equal(parsed.data.p_accommodation_id, 12);
  assert.ok(parseLogisticsForm(form({ pickup_by: "a".repeat(161) })).error);
  assert.ok(parseLogisticsForm(form({ pickup_by: new Blob(["not a name"]) })).error);
});

test("departure saves contain only independent departure fields and allow partial plans", () => {
  assert.deepEqual(parseDepartureForm(form({})).data, {
    p_family_id: 1, p_departure_mode: null, p_departure_date: null, p_departure_details: null, p_dropoff_by: null,
  });
  assert.deepEqual(parseDepartureForm(form({ departure_mode: "TRAIN", departure_date: "2028-02-29",
    departure_details: " Train 123 at 18:00 ", dropoff_by: " Ali   Khan ",
    travel_mode: "FLIGHT", arrival_date: "2028-02-20", pickup_by: "Someone else", accommodation_id: "12",
  })).data, {
    p_family_id: 1, p_departure_mode: "TRAIN", p_departure_date: "2028-02-29",
    p_departure_details: "Train 123 at 18:00", p_dropoff_by: "Ali Khan",
  });
  assert.equal(parseDepartureForm(form({ dropoff_by: "  " })).data.p_dropoff_by, null);
  for (const fields of [
    { family_id: "-1" }, { departure_mode: "BOAT" }, { departure_date: "2026-02-30" },
    { departure_date: "0000-01-01" }, { departure_details: "a".repeat(1001) },
    { dropoff_by: "a".repeat(161) }, { dropoff_by: new Blob(["not text"]) },
  ]) assert.ok(parseDepartureForm(form(fields)).error);
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

test("local families are excluded from outstanding arrangements and accommodation groups", () => {
  const localWithStay = { ...families[0], logistics: { ...families[0].logistics, arrival_support_required: false } };
  const localWithoutStay = { ...families[4], logistics: { ...families[4].logistics, arrival_support_required: false } };
  const noPlan = { ...families[3], accommodation: null, logistics: null };
  const entries = [localWithStay, localWithoutStay, families[1], noPlan];
  assert.equal(needsArrivalSupport(noPlan), true);
  assert.equal(needsArrivalSupport(families[1]), true);
  assert.equal(needsArrivalSupport(localWithStay), false);
  assert.equal(hasIncompleteArrival(localWithoutStay), false);
  assert.equal(hasIncompleteArrival(noPlan), true);
  assert.deepEqual(arrivalSupportSummary(entries), { assigned: 1, awaiting: 1, notRequired: 2 });
  assert.deepEqual(groupByAccommodation(entries).flatMap((group) => group.families.map((entry) => entry.id)), [2]);
  const restored = { ...localWithStay, logistics: { ...localWithStay.logistics, arrival_support_required: true } };
  assert.equal(groupByAccommodation([restored])[0].families[0].accommodation.id, families[0].accommodation.id);
  assert.equal(familyArrivals(restored.logistics)[0].arrival_date, families[0].logistics.arrival_date);
});

test("pickup sorting groups names ignoring case and puts unassigned families last", () => {
  const entries = families.map((entry, index) => ({
    ...entry,
    logistics: index === 4 ? null : { ...entry.logistics, pickup_by: ["Zain", "ali", "Ali", null, null, "Zain"][index] },
  }));
  assert.deepEqual(sortLogisticsFamilies(entries, "pickup").map((entry) => entry.id), [2, 3, 6, 1, 4, 5]);
  assert.deepEqual(sortLogisticsFamilies(entries, "arrival").map((entry) => entry.id), [2, 1, 3, 4, 5, 6]);
  assert.deepEqual(sortLogisticsFamilies(entries, "family").map((entry) => entry.id), [2, 3, 4, 5, 6, 1]);
  assert.deepEqual(entries.map((entry) => entry.id), [1, 2, 3, 4, 5, 6]);
});

test("departure sorting uses departure dates and drop-off people, independently of arrivals", () => {
  const entries = families.slice(0, 3).map((entry, index) => ({ ...entry, logistics: {
    ...entry.logistics, departure_date: [null, "2026-10-14", "2026-10-12"][index],
    dropoff_by: [null, "Zain", "Ali"][index], pickup_by: ["A", "B", "C"][index],
  } }));
  assert.deepEqual(sortLogisticsFamilies(entries, "departure").map((entry) => entry.id), [3, 2, 1]);
  assert.deepEqual(sortLogisticsFamilies(entries, "dropoff").map((entry) => entry.id), [3, 2, 1]);
  assert.deepEqual(sortLogisticsFamilies(entries, "pickup").map((entry) => entry.id), [1, 2, 3]);
});

test("multiple pickups preserve separate dates, guests and people; empty rows are omitted", () => {
  const entries = [
    { guests: " Amina ", arrival_date: "2026-10-09", travel_mode: "TRAIN", pickup_by: " Ali   Khan " },
    { guests: " Remaining family ", arrival_date: "2026-10-11", travel_mode: "FLIGHT", pickup_by: "Zain", travel_details: " Flight 123 " },
    {},
  ];
  const parsed = parseArrivalPlans(form({ arrivals: JSON.stringify(entries) }));
  assert.equal(parsed.data.length, 2);
  assert.deepEqual(parsed.data[0], { guests: "Amina", arrival_date: "2026-10-09", travel_mode: "TRAIN", pickup_by: "Ali Khan", travel_details: null,
    train_number: null, coach_number: null, flight_number: null });
  assert.equal(parsed.data[1].arrival_date, "2026-10-11");
  assert.equal(parsed.data[1].travel_details, "Flight 123");
  assert.deepEqual(parseArrivalPlans(form({ arrivals: "[]" })).data, []);
  assert.equal(parseArrivalPlans(form({ arrivals: '[{"guests":"Amina"}]' })).data[0].arrival_date, null);
  for (const arrivals of ["broken", "null", "{}", '[null]', '[{"arrival_date":"2026-02-30"}]', '[{"arrival_date":"0000-01-01"}]', '[{"pickup_by":3}]', '[{"travel_mode":"BOAT"}]',
    JSON.stringify([{ guests: "a".repeat(301) }]), JSON.stringify(Array(51).fill({}))]) {
    assert.ok(parseArrivalPlans(form({ arrivals })).error);
  }
});

test("each arrival saves only its selected travel numbers and retains leading zeros", () => {
  const parse = (entries) => parseArrivalPlans(form({ arrivals: JSON.stringify(entries) }));
  const numbers = { train_number: " 01234 ", coach_number: " B2 ", flight_number: " AI 101 " };
  const parsed = parse(["TRAIN", "FLIGHT", "CAR"].map((travel_mode) => ({ ...numbers, travel_mode })));
  assert.equal(parsed.error, undefined);
  assert.equal(travelSummary(parsed.data[0]), "Train 01234 · Coach B2");
  assert.equal(parsed.data[0].flight_number, null);
  assert.equal(travelSummary(parsed.data[1]), "Flight · AI 101");
  assert.equal(parsed.data[1].train_number, null);
  assert.equal(parsed.data[1].coach_number, null);
  assert.equal(parsed.data[2].flight_number, null);
  assert.equal(parsed.data[2].train_number, null);
  assert.equal(parsed.data[2].coach_number, null);
  assert.deepEqual(familyArrivals({ arrivals: parsed.data }), parsed.data);
  const legacy = familyArrivals({ travel_mode: "TRAIN", train_number: "00123", coach_number: "A1" });
  assert.equal(travelSummary(legacy[0]), "Train 00123 · Coach A1");
  for (const [travel_mode, field] of [["TRAIN", "train_number"], ["TRAIN", "coach_number"], ["FLIGHT", "flight_number"]]) {
    for (const value of [123, {}, "x".repeat(41)]) {
      assert.ok(parse([{ travel_mode, [field]: value }]).error);
    }
    assert.equal(parse([{ travel_mode, [field]: "   " }]).data[0][field], null);
  }
});

test("legacy arrivals remain visible and multiple arrivals drive sorting without mutation", () => {
  const original = { ...families[0].logistics, pickup_by: "Ali" };
  assert.equal(familyArrivals(original)[0].arrival_date, "2026-10-10");
  assert.equal(familyArrivals(original)[0].pickup_by, "Ali");
  assert.deepEqual(familyArrivals({ ...original, arrivals: [] }), []);
  const arrivals = [
    { guests: "Later", arrival_date: "2026-10-12", pickup_by: "Zain" },
    { guests: "Earlier", arrival_date: "2026-10-08", pickup_by: "Aaron" },
  ];
  const split = { ...families[0], logistics: { ...original, arrivals } };
  assert.equal(earliestArrival(split.logistics), "2026-10-08");
  assert.deepEqual(sortLogisticsFamilies([families[1], split], "arrival").map((entry) => entry.id), [1, 2]);
  assert.deepEqual(sortLogisticsFamilies([{ ...families[1], logistics: { ...families[1].logistics, pickup_by: "Bilal" } }, split], "pickup").map((entry) => entry.id), [1, 2]);
  familyArrivals(split.logistics).reverse();
  assert.equal(arrivals[0].guests, "Later");
});

test("arrival times validate at minute precision and require a date", () => {
  for (const time of ["00:00", "09:30", "23:59", null]) {
    const parsed = parseArrivalPlans(form({ arrivals: JSON.stringify([{ arrival_date: "2026-10-09", arrival_time: time }]) }));
    assert.equal(parsed.data[0].arrival_time, time);
  }
  for (const entry of [
    { arrival_date: "2026-10-09", arrival_time: "24:00" },
    { arrival_date: "2026-10-09", arrival_time: "12:60" },
    { arrival_date: "2026-10-09", arrival_time: "9:00" },
    { arrival_date: "2026-10-09", arrival_time: "09:00Z" },
    { arrival_date: "2026-10-09", arrival_time: 930 },
    { arrival_time: "09:30" },
  ]) assert.ok(parseArrivalPlans(form({ arrivals: JSON.stringify([entry]) })).error);
  assert.equal(formatArrivalDateTime({ arrival_date: "2026-10-09", arrival_time: "00:00" }), "9 Oct 2026 · 00:00 IST");
  assert.equal(formatArrivalDateTime({ arrival_date: "2026-10-09" }), "9 Oct 2026 · Time not set");
});

test("time grouping includes each pickup across families and keeps unknown times separate", () => {
  const plan = (date, time) => ({ guests: "A guest", arrival_date: date, arrival_time: time, travel_mode: "TRAIN", pickup_by: "Ali" });
  const a = { ...families[0], logistics: { ...families[0].logistics, arrivals: [plan("2026-10-10", "12:00"), plan("2026-10-10", "09:30")] } };
  const b = { ...families[1], logistics: { ...families[1].logistics, arrivals: [plan("2026-10-10", "09:30"), plan("2026-10-11", "09:30")] } };
  const c = { ...families[2], logistics: { ...families[2].logistics, arrivals: [plan("2026-10-10", null), plan(null, null)] } };
  const local = { ...a, id: 99, logistics: { ...a.logistics, arrival_support_required: false } };
  const groups = groupArrivalsByTime([a, b, c, local]);
  assert.deepEqual(groups.map((group) => group.key), ["2026-10-10T09:30", "2026-10-10T12:00", "2026-10-10T99:99", "2026-10-11T09:30", "9999-99-99T99:99"]);
  assert.deepEqual(groups[0].entries.map((entry) => entry.family.id), [2, 1]);
  assert.equal(groups.reduce((count, group) => count + group.entries.length, 0), 6);
  const later = { ...a, logistics: { ...a.logistics, arrivals: [plan("2026-10-10", "15:00")] } };
  assert.deepEqual(sortLogisticsFamilies([later, b, c], "arrival").map((entry) => entry.id), [2, 1, 3]);
  assert.deepEqual(sortAccommodationFamilies([later, b, c], "arrival").map((entry) => entry.id), [2, 1, 3]);
  assert.equal(a.logistics.arrivals[0].arrival_time, "12:00");
});

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
