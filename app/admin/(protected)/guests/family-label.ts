// Shared so the roster and the create action label a family identically.
export function familyLabel(
  guestNames: string[],
  familyId: number,
  familyName?: string | null,
): string {
  if (familyName?.trim()) return familyName.trim();
  if (guestNames.length === 0) return `Empty family · #${familyId}`;
  return guestNames.join(", ");
}
