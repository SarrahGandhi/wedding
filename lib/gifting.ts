export const GIFT_STATUSES = ["Awaiting", "Received"] as const;
export const CATEGORY_STATUSES = ["Awaiting", "Pending", "Completed"] as const;
export type GiftStatus = typeof GIFT_STATUSES[number];
export type GiftCategoryStatus = typeof CATEGORY_STATUSES[number];
export type Gift = { id: string; name: string; status: GiftStatus };
export type GiftCategory = { id: string; name: string; status: GiftCategoryStatus; creatives: string; gifts: Gift[] };
export type GiftRecipient = { id: string; name: string; categories: GiftCategory[] };

export function moveEntry<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function parseStatus<T extends string>(value: unknown, options: readonly T[]): T {
  // Plans saved before status tracking have no status field.
  if (value === undefined) return options[0];
  if (typeof value !== "string" || !options.includes(value as T)) {
    throw new Error(`Choose a valid status: ${options.join(", ")}.`);
  }
  return value as T;
}

// Rebuild the payload so unexpected fields can never be persisted by the action.
export function parseGiftPlan(value: unknown): GiftRecipient[] {
  const ids = new Set<string>();
  const record = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid gifting entry.");
    return value as Record<string, unknown>;
  };
  const text = (value: unknown, label: string, max: number, optional = false) => {
    if (typeof value !== "string" || value.trim().length > max || (!optional && !value.trim())) {
      throw new Error(`Enter ${label}${optional ? "" : " (required)"}, up to ${max} characters.`);
    }
    return value.trim();
  };
  const id = (value: unknown) => {
    if (typeof value !== "string" || !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value) || ids.has(value)) {
      throw new Error("Invalid or duplicate gifting entry. Reload the page and try again.");
    }
    ids.add(value);
    return value;
  };
  const list = (value: unknown): unknown[] => {
    if (!Array.isArray(value) || value.length > 500) throw new Error("Each list can contain up to 500 entries.");
    return value;
  };
  if (JSON.stringify(value)?.length > 500_000) throw new Error("This gifting plan is too large to save.");
  return list(value).map((entry) => {
    const recipient = record(entry);
    return { id: id(recipient.id), name: text(recipient.name, "a recipient name", 160), categories: list(recipient.categories).map((entry) => {
      const category = record(entry);
      return { id: id(category.id), name: text(category.name, "a category", 160), status: parseStatus(category.status, CATEGORY_STATUSES), creatives: text(category.creatives, "creative requirements", 5000, true), gifts: list(category.gifts).map((entry) => {
        const gift = record(entry);
        return { id: id(gift.id), name: text(gift.name, "a gift name", 200), status: parseStatus(gift.status, GIFT_STATUSES) };
      }) };
    }) };
  });
}
