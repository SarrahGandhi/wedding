"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { GUEST_CATEGORIES, GUEST_SIDES } from "@/lib/types";
import {
  parseEnum,
  parseId,
  parseString,
  parseNullable,
  parseEmail,
  parseEmailList,
} from "@/app/shared/action-helpers";

// ---------------------------------------------------------------------------
// Guest CRUD
// ---------------------------------------------------------------------------

export async function createGuest(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const name = parseString(formData.get("name"));
  const category = parseEnum(formData.get("category"), GUEST_CATEGORIES);
  const family_id = parseId(formData.get("family_id"));

  if (!name) throw new Error("Name is required.");
  if (!category) throw new Error("Pick a category.");
  if (family_id === null) throw new Error("Family is required.");

  const { error } = await supabase
    .from("guests")
    .insert({ name, category, family_id });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/guests");
}

export async function updateGuest(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = parseId(formData.get("id"));
  const name = parseString(formData.get("name"));
  const category = parseEnum(formData.get("category"), GUEST_CATEGORIES);

  if (id === null) return { error: "Invalid id." };
  if (!name) return { error: "Name is required." };
  if (!category) return { error: "Pick a category." };

  const { error } = await supabase
    .from("guests")
    .update({ name, category })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/guests");
  return { success: true };
}

export async function deleteGuest(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = parseId(formData.get("id"));
  if (id === null) return { error: "Invalid id." };

  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/guests");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Family CRUD
// ---------------------------------------------------------------------------

export async function createFamily(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const side = parseEnum(formData.get("side"), GUEST_SIDES);
  const { emails, invalid } = parseEmailList(formData.get("emails"));
  const phone = parseNullable(formData.get("phone"));

  if (!side) throw new Error("Pick a side.");
  if (invalid) throw new Error(`Invalid email: ${invalid}`);

  const { error } = await supabase
    .from("guest_families")
    .insert({ side, email: emails, phone });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/guests");
}

export async function updateFamily(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = parseId(formData.get("id"));
  const side = parseEnum(formData.get("side"), GUEST_SIDES);
  const { emails, invalid } = parseEmailList(formData.get("emails"));
  const phone = parseNullable(formData.get("phone"));

  if (id === null) return { error: "Invalid id." };
  if (!side) return { error: "Pick a side." };
  if (invalid) return { error: `Invalid email: ${invalid}` };

  const { error } = await supabase
    .from("guest_families")
    .update({ side, email: emails, phone })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/guests");
  return { success: true };
}

export async function appendFamilyEmail(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = parseId(formData.get("id"));
  const email = parseEmail(formData.get("email"));

  if (id === null) return { error: "Invalid id." };
  if (!email) return { error: "Invalid email." };

  const { error } = await supabase.rpc("append_family_email", {
    family_row_id: id,
    new_email: email,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/guests");
  return { success: true };
}

export async function deleteFamily(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = parseId(formData.get("id"));
  if (id === null) return { error: "Invalid id." };

  const { error } = await supabase
    .from("guest_families")
    .delete()
    .eq("id", id);
  if (error) {
    return {
      error:
        error.message.includes("foreign key")
          ? "This family still has guests linked to it. Move or delete them first."
          : error.message,
    };
  }

  revalidatePath("/admin/guests");
  return { success: true };
}
