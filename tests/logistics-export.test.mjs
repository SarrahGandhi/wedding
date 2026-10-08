import assert from "node:assert/strict";
import { test } from "node:test";
import ExcelJS from "exceljs";
import { createLogisticsExport, downloadLogisticsExport } from "../lib/logistics-export.ts";

const family = (id, logistics = null, accommodation = null) => ({
  id, label: `Family ${id}`, side: "BRIDE",
  guests: [{ id, name: "Amina & Bilal" }, { id: id + 10, name: "Zoë Gandhi" }],
  logistics, accommodation,
});

test("Excel export round-trips the requested columns, dates and saved family details", async () => {
  const bytes = await createLogisticsExport([
    family(2, { travel_mode: "TRAIN", arrival_date: "2026-10-09", train_number: "01234", coach_number: "B2", travel_details: "Pickup at station\nTwo bags" }, { name: "Gandhi house", kind: "HOUSE", room_number: "02A" }),
    family(1, { travel_mode: "FLIGHT", flight_number: "AI 101", coach_number: "stale coach", travel_details: "=1+1" }, { name: "Lake Hotel", kind: "HOTEL", room_number: null }),
    family(3),
  ]);
  assert.equal(Buffer.from(bytes).subarray(0, 2).toString(), "PK");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);
  assert.equal(workbook.worksheets.length, 1);
  const sheet = workbook.getWorksheet("Logistics");
  assert.deepEqual(sheet.getRow(1).values.slice(1), [
    "DATE OF ARRIVAL", "TIME", "TRAIN/FLIGHT DETAILS", "COACH DETAILS", "NAME OF GUESTS",
    "ACCOMODATION", "LOCATION", "DATE", "DEPARTURE DETAILS", "TIME", "REMARKS",
  ]);
  assert.equal(sheet.rowCount, 4);
  assert.equal(sheet.getCell("A2").value.toISOString(), "2026-10-09T00:00:00.000Z");
  assert.equal(sheet.getCell("A2").numFmt, "dd mmm yyyy");
  assert.equal(sheet.getCell("C2").value, "Train 01234");
  assert.equal(sheet.getCell("D2").value, "B2");
  assert.equal(sheet.getCell("E2").value, "Amina & Bilal\nZoë Gandhi");
  assert.equal(sheet.getCell("F2").value, "Gandhi house");
  assert.equal(sheet.getCell("G2").value, "Room 02A");
  assert.equal(sheet.getCell("K2").value, "Pickup at station\nTwo bags");
  for (const column of ["B", "H", "I", "J"]) assert.equal(sheet.getCell(`${column}2`).value, null);
  assert.equal(sheet.getCell("C3").value, "Flight AI 101");
  assert.equal(sheet.getCell("D3").value, null);
  assert.equal(sheet.getCell("F3").value, "Lake Hotel");
  assert.equal(sheet.getCell("G3").value, null);
  assert.equal(sheet.getCell("K3").value, "=1+1");
  assert.equal(sheet.getCell("K3").type, ExcelJS.ValueType.String);
  for (const column of ["A", "C", "D", "F", "G", "K"]) assert.equal(sheet.getCell(`${column}4`).value, null);
  assert.equal(sheet.autoFilter, "A1:K4");
  assert.equal(sheet.views[0].ySplit, 1);
  assert.equal(sheet.views[0].state, "frozen");
  assert.equal(sheet.getCell("E2").alignment.wrapText, true);
});

test("an empty export remains a valid workbook with the requested headings", async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await createLogisticsExport([]));
  assert.equal(workbook.getWorksheet("Logistics").rowCount, 1);
  assert.equal(workbook.getWorksheet("Logistics").columnCount, 11);
});

test("export sorts arrival dates chronologically, leaving undated families last without changing input order", async () => {
  const families = [
    family(1),
    family(2, { arrival_date: "2026-11-01" }),
    family(3, { arrival_date: "2026-10-09" }),
    family(4, { arrival_date: "2026-10-02" }),
    family(5, { arrival_date: null }),
  ];
  for (const entry of families) entry.guests = [{ id: entry.id, name: entry.label }];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await createLogisticsExport(families));
  const sheet = workbook.getWorksheet("Logistics");
  assert.deepEqual([2, 3, 4, 5, 6].map((row) => sheet.getCell(`E${row}`).value),
    ["Family 4", "Family 3", "Family 2", "Family 1", "Family 5"]);
  assert.deepEqual(families.map((entry) => entry.id), [1, 2, 3, 4, 5]);
});

test("export keeps room labels from repeating", async () => {
  const rooms = ["room 1", "Room 2", " ROOM 3 ", "02A", "   ", null];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await createLogisticsExport(rooms.map((room_number, index) =>
    family(index, null, { name: "Lake Hotel", kind: "HOTEL", room_number }))));
  const sheet = workbook.getWorksheet("Logistics");
  assert.deepEqual(rooms.map((_, index) => sheet.getCell(`G${index + 2}`).value),
    ["room 1", "Room 2", "ROOM 3", "Room 02A", null, null]);
});

test("browser download uses an XLSX blob and releases the temporary link", async (t) => {
  const link = { click: t.mock.fn(), remove: t.mock.fn() };
  const createObjectURL = t.mock.method(URL, "createObjectURL", (blob) => {
    assert.equal(blob.type, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    assert.ok(blob.size > 0);
    return "blob:test-logistics";
  });
  const revokeObjectURL = t.mock.method(URL, "revokeObjectURL", () => {});
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "document", { configurable: true, value: { createElement: () => link, body: { appendChild: t.mock.fn() } } });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { setTimeout: (callback) => callback() } });
  t.after(() => {
    if (originalDocument) Object.defineProperty(globalThis, "document", originalDocument);
    else delete globalThis.document;
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else delete globalThis.window;
  });
  await downloadLogisticsExport([family(1)]);
  assert.equal(createObjectURL.mock.callCount(), 1);
  assert.equal(link.href, "blob:test-logistics");
  assert.match(link.download, /^wedding-logistics-\d{4}-\d{2}-\d{2}\.xlsx$/);
  assert.equal(link.click.mock.callCount(), 1);
  assert.equal(link.remove.mock.callCount(), 1);
  assert.equal(revokeObjectURL.mock.calls[0].arguments[0], "blob:test-logistics");
});

test("export associates each room with its guest and retains explicitly unassigned rooms", async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await createLogisticsExport([
    family(1, { guest_rooms: { 1: "02A", 11: null } }, { name: "Lake Hotel", kind: "HOTEL", room_number: "100" }),
  ]));
  assert.equal(workbook.getWorksheet("Logistics").getCell("G2").value, "Amina & Bilal: Room 02A\nZoë Gandhi: Room not assigned");
});
