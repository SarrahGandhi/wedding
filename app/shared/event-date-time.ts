export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_RE = /^\d{2}:\d{2}$/;

export function toDateInputValue(value: string) {
  const match = value
    .trim()
    .match(/^(\d{4}-\d{2}-\d{2})/);

  return match?.[1] ?? "";
}

export function toTimeInputValue(value: string | null) {
  if (!value) return "";

  const match = value.trim().match(/^(\d{2}:\d{2})/);
  return match?.[1] ?? "";
}

export function formatEventDateTime(
  date: string,
  time: string | null,
  options: Intl.DateTimeFormatOptions
) {
  const dateValue = toDateInputValue(date);
  if (!dateValue) return date;

  const timeValue = toTimeInputValue(time) || "00:00";
  return new Date(`${dateValue}T${timeValue}`).toLocaleString("en-US", options);
}

export function eventDateTimeSortValue(date: string, time: string | null) {
  const dateValue = toDateInputValue(date);
  const timeValue = toTimeInputValue(time) || "00:00";

  return `${dateValue}T${timeValue}`;
}
