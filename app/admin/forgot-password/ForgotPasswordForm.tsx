"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

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
      <label className="block">
        <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
          Email
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          autoFocus
          disabled={pending}
          className="mt-2 w-full bg-warm-white border border-border/60 px-4 py-3 font-body text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/60 transition-colors disabled:opacity-60"
        />
      </label>

      {error && (
        <p className="text-xs text-red-500 font-body border-l-2 border-red-300 pl-3 py-1">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-foreground text-background py-3 text-[10px] tracking-[0.3em] uppercase font-body hover:bg-accent transition-colors disabled:opacity-40 cursor-pointer"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>

      <Link
        href="/admin"
        className="block text-center text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body hover:text-accent transition-colors"
      >
        Back to sign in
      </Link>
    </form>
  );
}
