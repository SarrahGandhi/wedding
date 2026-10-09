import ExcelJS from "exceljs";
import type { LogisticsFamily } from "./logistics";

// Keep the supplied layout, including the two separate TIME columns.
export const LOGISTICS_EXPORT_HEADERS = [
  "DATE OF ARRIVAL", "TIME", "TRAIN/FLIGHT DETAILS", "COACH DETAILS",
  "NAME OF GUESTS", "ACCOMODATION", "LOCATION", "DATE",
  "DEPARTURE DETAILS", "TIME", "REMARKS",
] as const;

const COLUMN_WIDTHS = [20, 14, 28, 20, 38, 32, 26, 20, 30, 14, 48];
const FONT_SIZE = 14;
const ACCOMMODATION_COLORS = [
  "FFE2F0D9", "FFFFF2CC", "FFFCE4D6", "FFE4DFEC",
  "FFDDF2EF", "FFF8DFEA", "FFECE5D8", "FFF0EED5",
];

const accommodationKey = (name?: string | null) => name?.trim().replace(/\s+/g, " ").toLowerCase() ?? "";

export async function createLogisticsExport(families: LogisticsFamily[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Logistics", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: false }],
    pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.columns = LOGISTICS_EXPORT_HEADERS.map((header, index) => ({
    header, width: COLUMN_WIDTHS[index],
    style: {
      font: { name: "Calibri", size: FONT_SIZE, color: { argb: "FF000000" } },
      alignment: { vertical: "top", wrapText: true },
      numFmt: "@",
    },
  }));
  for (const column of [1, 8]) sheet.getColumn(column).numFmt = "dd mmm yyyy";
  for (const column of [2, 10]) sheet.getColumn(column).numFmt = "hh:mm";

  const accommodationNames = [...new Set(families.map((family) => accommodationKey(family.accommodation?.name)))].filter(Boolean).sort();
  const accommodationColors = new Map<string, string>();
  let colorIndex = 0;
  for (const name of accommodationNames) {
    accommodationColors.set(name, /\bmarhaba\b/.test(name)
      ? "FFDDEBF7"
      : ACCOMMODATION_COLORS[colorIndex++ % ACCOMMODATION_COLORS.length]);
  }

  const orderedFamilies = [...families].sort((a, b) =>
    (a.logistics?.arrival_date || "9999-99-99").localeCompare(b.logistics?.arrival_date || "9999-99-99"));
  for (const family of orderedFamilies) {
    const plan = family.logistics;
    const stay = family.accommodation;
    const guestRooms = plan?.guest_rooms;
    const room = stay?.room_number?.trim();
    const roomAssignments = guestRooms && typeof guestRooms === "object" && !Array.isArray(guestRooms)
      && Object.keys(guestRooms).length > 0
      ? family.guests.map((guest) => {
        const assigned = Object.hasOwn(guestRooms, String(guest.id)) ? guestRooms[String(guest.id)] : room;
        return `${guest.name}: ${typeof assigned === "string" && assigned ? `Room ${assigned}` : "Room not assigned"}`;
      }).join("\n") : null;
    const mode = plan?.travel_mode;
    const travel = mode === "TRAIN" ? ["Train", plan?.train_number].filter(Boolean).join(" ")
      : mode === "FLIGHT" ? ["Flight", plan?.flight_number].filter(Boolean).join(" ")
        : mode ? mode[0] + mode.slice(1).toLowerCase() : null;
    // Keep time and departure cells empty for manual completion.
    const values = [
      plan?.arrival_date ? new Date(`${plan.arrival_date}T00:00:00Z`) : null,
      null,
      travel,
      mode === "TRAIN" ? plan?.coach_number ?? null : null,
      family.guests.map((guest) => guest.name).join("\n"),
      stay?.name ?? null,
      roomAssignments ?? (room ? (/^room\b/i.test(room) ? room : `Room ${room}`) : null),
      null, null, null,
      plan?.travel_details ?? null,
    ];
    const row = sheet.addRow(values);
    // Estimate wrapped lines so family names and notes remain readable.
    const lines = values.map((value, index) => typeof value === "string"
      ? value.split("\n").reduce((count, line) => count + Math.max(1, Math.ceil(line.length / ((COLUMN_WIDTHS[index] - 3) * 11 / FONT_SIZE))), 0)
      : 1);
    row.height = Math.min(409, Math.max(36, Math.max(...lines) * 20 + 8));
  }

  sheet.getRow(1).height = 52;
  sheet.eachRow((row) => {
    const background = row.number === 1 ? "FFFFFFFF"
      : accommodationColors.get(accommodationKey(row.getCell(6).value as string | null)) ?? "FFFFFFFF";
    for (let column = 1; column <= LOGISTICS_EXPORT_HEADERS.length; column++) {
      const cell = row.getCell(column);
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: background } };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      };
    }
  });
  sheet.autoFilter = `A1:K${sheet.rowCount}`;
  sheet.pageSetup.printTitlesRow = "1:1";
  sheet.pageSetup.printArea = `A1:K${sheet.rowCount}`;
  return new Uint8Array(await workbook.xlsx.writeBuffer());
}

export async function downloadLogisticsExport(families: LogisticsFamily[]) {
  const bytes = await createLogisticsExport(families);
  const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `wedding-logistics-${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    // Let the browser begin reading the download before releasing its URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
