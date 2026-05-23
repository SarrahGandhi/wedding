"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";
import { FormField } from "@/app/shared/FormField";
import { Button } from "@/app/shared/Button";
import { ErrorMessage } from "@/app/shared/ErrorMessage";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<
    ForgotPasswordState,
    FormData
  >(forgotPasswordAction, undefined);

  const success = state && "success" in state ? state.success : null;
  const error = state && "error" in state ? state.error : null;

  if (success) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-accent font-body border-l-2 border-accent/40 pl-3 py-1 leading-relaxed">
          {success}
        </p>
        <Link
          href="/admin"
          className="block w-full bg-foreground text-background py-3 text-[10px] tracking-[0.3em] uppercase font-body hover:bg-accent transition-colors text-center"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <FormField
        label="Email"
        size="lg"
        type="email"
        name="email"
        required
        autoComplete="email"
        autoFocus
        disabled={pending}
      />

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <Button type="submit" variant="block" pending={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <Link
        href="/admin"
        className="block text-center text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body hover:text-accent transition-colors"
      >
        Back to sign in
      </Link>
    </form>
  );
}
