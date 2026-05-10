"use client";

import { useActionState } from "react";
import { setPasswordAction, type SetPasswordState } from "./actions";

export function SetPasswordForm() {
  const [state, formAction, pending] = useActionState<
    SetPasswordState,
    FormData
  >(setPasswordAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <label className="block">
        <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
          Password
        </span>
        <input
          type="password"
          name="password"
          required
          minLength={6}
          autoComplete="new-password"
          autoFocus
          disabled={pending}
          className="mt-2 w-full bg-warm-white border border-border/60 px-4 py-3 font-body text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/60 transition-colors disabled:opacity-60"
        />
      </label>

      <label className="block">
        <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
          Confirm Password
        </span>
        <input
          type="password"
          name="confirm"
          required
          minLength={6}
          autoComplete="new-password"
          disabled={pending}
          className="mt-2 w-full bg-warm-white border border-border/60 px-4 py-3 font-body text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/60 transition-colors disabled:opacity-60"
        />
      </label>

      {state?.error && (
        <p className="text-xs text-red-500 font-body border-l-2 border-red-300 pl-3 py-1">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-foreground text-background py-3 text-[10px] tracking-[0.3em] uppercase font-body hover:bg-accent transition-colors disabled:opacity-40 cursor-pointer"
      >
        {pending ? "Saving…" : "Set password"}
      </button>
    </form>
  );
}
