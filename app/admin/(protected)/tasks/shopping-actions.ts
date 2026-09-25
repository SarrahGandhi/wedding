"use server";

import { revalidatePath } from "next/cache";
import { parseShoppingListItem, shoppingListItemIdentity } from "@/lib/shopping-list";
import { requireAdmin } from "@/lib/supabase/admin-auth";

const staleMessage = "This item has changed. Refresh the page and reopen it before trying again.";

export async function saveShoppingListItem(form: FormData) {
  const { supabase } = await requireAdmin();
  const parsed = parseShoppingListItem(form);
  if (!parsed.data) return { error: parsed.error };

  if (form.has("id")) {
    const row = shoppingListItemIdentity(form);
    if (!row) return { error: "Refresh the page and try again." };
    const { data, error } = await supabase.from("shopping_list_items")
      .update(parsed.data).eq("id", row.id).eq("revision", row.revision).select("id").maybeSingle();
    if (error) return { error: "Could not save this item. Try again." };
    if (!data) return { error: staleMessage };
  } else {
    const { error } = await supabase.from("shopping_list_items").insert(parsed.data);
    if (error) return { error: "Could not add this item. Try again." };
  }
  revalidatePath("/admin/tasks");
  return { success: true };
}

export async function setShoppingListItemPurchased(form: FormData) {
  const { supabase } = await requireAdmin();
  const row = shoppingListItemIdentity(form);
  const purchased = form.get("purchased");
  if (!row || (purchased !== "true" && purchased !== "false")) {
    return { error: "Refresh the page and try again." };
  }
  const { data, error } = await supabase.from("shopping_list_items")
    .update({ purchased: purchased === "true" })
    .eq("id", row.id).eq("revision", row.revision).select("id").maybeSingle();
  if (error) return { error: "Could not update this item. Try again." };
  if (!data) return { error: staleMessage };
  revalidatePath("/admin/tasks");
  return { success: true };
}
