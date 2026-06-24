export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DATE_TIME_LOCAL_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function parseEnum<T extends string>(
  value: FormDataEntryValue | null,
  values: readonly T[],
): T | null {
  const v = String(value ?? "");
  return (values as readonly string[]).includes(v) ? (v as T) : null;
}

export function parseId(value: FormDataEntryValue | null): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseString(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

export function parseNullable(value: FormDataEntryValue | null): string | null {
  const v = parseString(value);
  return v ? v : null;
}

export function parseEmail(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim().toLowerCase();
  return EMAIL_RE.test(v) ? v : null;
}

export function parseEmailList(
  raw: FormDataEntryValue | null,
): { emails: string[]; invalid?: string } {
  const text = String(raw ?? "");
  const parts = text
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const seen = new Set<string>();
  const dedup: string[] = [];
  for (const e of parts) {
    if (!EMAIL_RE.test(e)) return { emails: [], invalid: e };
    if (seen.has(e)) continue;
    seen.add(e);
    dedup.push(e);
  }
  return { emails: dedup };
}
