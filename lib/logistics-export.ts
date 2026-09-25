import ExcelJS from "exceljs";
import type { LogisticsFamily } from "./logistics";

// Keep the supplied layout, including the two separate TIME columns.
export const LOGISTICS_EXPORT_HEADERS = [
  "DATE OF ARRIVAL", "TIME", "TRAIN/FLIGHT DETAILS", "COACH DETAILS",
  "NAME OF GUESTS", "ACCOMODATION", "LOCATION", "DATE",
  "DEPARTURE DETAILS", "TIME", "REMARKS",
] as const;

const COLUMN_WIDTHS = [20, 14, 28, 20, 38, 32, 26, 20, 30, 14, 48];

export async function createLogisticsExport(families: LogisticsFamily[]) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Logistics", {
    views: [{ state: "frozen", ySplit: 1, showGridLines: false }],
    pageSetup: { orientation: "landscape", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.columns = LOGISTICS_EXPORT_HEADERS.map((header, index) => ({
    header, width: COLUMN_WIDTHS[index],
    style: {
      font: { name: "Arial", size: 11, color: { argb: "FF292524" } },
      alignment: { vertical: "top", wrapText: true },
      numFmt: "@",
    },
  }));
  for (const column of [1, 8]) sheet.getColumn(column).numFmt = "dd mmm yyyy";
  for (const column of [2, 10]) sheet.getColumn(column).numFmt = "hh:mm";

  for (const family of families) {
    const plan = family.logistics;
    const stay = family.accommodation;
    const mode = plan?.travel_mode;
    const travel = mode === "TRAIN" ? ["Train", plan?.train_number].filter(Boolean).join(" ")
      : mode === "FLIGHT" ? ["Flight", plan?.flight_number].filter(Boolean).join(" ")
        : mode ? mode[0] + mode.slice(1).toLowerCase() : null;
    // Times, location and departure details are not yet captured by the form.
    // Keep their cells empty for manual completion, rather than guessing from notes.
    const values = [
      plan?.arrival_date ? new Date(`${plan.arrival_date}T00:00:00Z`) : null,
      null,
      travel,
      mode === "TRAIN" ? plan?.coach_number ?? null : null,
      family.guests.map((guest) => guest.name).join("\n"),
      stay ? `${stay.name}${stay.room_number ? ` · Room ${stay.room_number}` : ""}` : null,
      null, null, null, null,
      plan?.travel_details ?? null,
    ];
    const row = sheet.addRow(values);
    // Estimate wrapped lines so family names and notes remain readable.
    const lines = values.map((value, index) => typeof value === "string"
      ? value.split("\n").reduce((count, line) => count + Math.max(1, Math.ceil(line.length / (COLUMN_WIDTHS[index] - 3))), 0)
      : 1);
    row.height = Math.min(409, Math.max(30, Math.max(...lines) * 15 + 8));
    if (row.number % 2 === 0) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF5F3EF" } };
      });
    }
  }

  const header = sheet.getRow(1);
  header.height = 36;
  header.eachCell((cell) => {
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF44403C" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
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
