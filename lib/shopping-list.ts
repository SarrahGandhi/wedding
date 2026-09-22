import type { Database } from "./supabase/database.types";

export type ShoppingListItem = Database["public"]["Tables"]["shopping_list_items"]["Row"];
export type ShoppingUrgency = ShoppingListItem["urgency"];

export const SHOPPING_URGENCY_LABELS: Record<ShoppingUrgency, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
};

const URGENCIES: ShoppingUrgency[] = ["LOW", "MEDIUM", "HIGH"];

export function parseShoppingListItem(form: FormData):
  | { error: string; data?: never }
  | { data: Pick<ShoppingListItem, "item" | "store" | "vendor" | "urgency" | "purchased">; error?: never } {
  const item = form.get("item");
  const store = form.get("store");
  const vendor = form.get("vendor");
  const urgency = form.get("urgency");
  const purchased = form.get("purchased");

  if (typeof item !== "string" || !item.trim() || item.trim().length > 200) {
    return { error: "Enter an item name of up to 200 characters." };
  }
  if (typeof store !== "string" || !store.trim() || store.trim().length > 160) {
    return { error: "Enter where to buy of up to 160 characters." };
  }
  if (typeof vendor !== "string" || !vendor.trim() || vendor.trim().length > 160) {
    return { error: "Enter whom you are buying from, up to 160 characters." };
  }
  if (typeof urgency !== "string" || !URGENCIES.includes(urgency as ShoppingUrgency)) {
    return { error: "Choose a valid urgency level." };
  }
  if (purchased !== null && purchased !== "on") {
    return { error: "Choose a valid purchased status." };
  }
  return {
    data: {
      item: item.trim(),
      store: store.trim(),
      vendor: vendor.trim(),
      urgency: urgency as ShoppingUrgency,
      purchased: purchased === "on",
    },
  };
}

export function shoppingListItemIdentity(form: FormData) {
  const id = Number(form.get("id"));
  const revision = Number(form.get("revision"));
  return Number.isSafeInteger(id) && id > 0 && Number.isSafeInteger(revision) && revision > 0
    ? { id, revision } : null;
}

export const SHOPPING_URGENCY_ORDER: Record<ShoppingUrgency, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
};

export function compareShoppingItems(a: ShoppingListItem, b: ShoppingListItem) {
  if (a.purchased !== b.purchased) return a.purchased ? 1 : -1;
  const urgency = SHOPPING_URGENCY_ORDER[a.urgency] - SHOPPING_URGENCY_ORDER[b.urgency];
  if (urgency !== 0) return urgency;
  return a.id - b.id;
}
