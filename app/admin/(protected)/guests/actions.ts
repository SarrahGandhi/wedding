"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import {
  GUEST_CATEGORIES,
  GUEST_SIDES,
  type GuestCategory,
  type GuestSide,
} from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCategory(value: FormDataEntryValue | null): GuestCategory | null {
  const v = String(value ?? "");
  return (GUEST_CATEGORIES as readonly string[]).includes(v)
    ? (v as GuestCategory)
    : null;
}

function parseSide(value: FormDataEntryValue | null): GuestSide | null {
  const v = String(value ?? "");
  return (GUEST_SIDES as readonly string[]).includes(v)
    ? (v as GuestSide)
    : null;
}

function parseFamilyId(value: FormDataEntryValue | null): number | null {
  const v = String(value ?? "").trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseEmails(raw: FormDataEntryValue | null): {
  emails: string[];
  invalid?: string;
} {
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

function parsePhone(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v ? v : null;
}

// ---------------------------------------------------------------------------
// Guest CRUD
// ---------------------------------------------------------------------------

export async function createGuest(formData: FormData): Promise<void> {
  const { supabase } = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const category = parseCategory(formData.get("category"));
  const family_id = parseFamilyId(formData.get("family_id"));

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
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const category = parseCategory(formData.get("category"));
  const family_id = parseFamilyId(formData.get("family_id"));

  if (!Number.isFinite(id)) return { error: "Invalid id." };
  if (!name) return { error: "Name is required." };
  if (!category) return { error: "Pick a category." };
  if (family_id === null) return { error: "Family is required." };

  const { error } = await supabase
    .from("guests")
    .update({ name, category, family_id })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/guests");
  return { success: true };
}

export async function deleteGuest(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { error: "Invalid id." };

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
  const side = parseSide(formData.get("side"));
  const { emails, invalid } = parseEmails(formData.get("emails"));
  const phone = parsePhone(formData.get("phone"));

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
  const id = Number(formData.get("id"));
  const side = parseSide(formData.get("side"));
  const { emails, invalid } = parseEmails(formData.get("emails"));
  const phone = parsePhone(formData.get("phone"));

  if (!Number.isFinite(id)) return { error: "Invalid id." };
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
  const id = Number(formData.get("id"));
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!Number.isFinite(id)) return { error: "Invalid id." };
  if (!EMAIL_RE.test(email)) return { error: "Invalid email." };

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
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { error: "Invalid id." };

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
