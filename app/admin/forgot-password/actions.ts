"use server";

import { createClient } from "@/lib/supabase/server";

export type ForgotPasswordState =
  | { error: string }
  | { success: string }
  | undefined;

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    return { error: "Email is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    return { error: error.message };
  }

  return { success: "If an account exists with that email, a reset link has been sent." };
}
