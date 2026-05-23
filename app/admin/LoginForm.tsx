"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type LoginState } from "./actions";
import { FormField } from "@/app/shared/FormField";
import { Button } from "@/app/shared/Button";
import { ErrorMessage } from "@/app/shared/ErrorMessage";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined
  );

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

      <FormField
        label="Password"
        size="lg"
        type="password"
        name="password"
        required
        autoComplete="current-password"
        disabled={pending}
      />

      {state?.error && <ErrorMessage>{state.error}</ErrorMessage>}

      <Button type="submit" variant="block" pending={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <Link
        href="/admin/forgot-password"
        className="block text-center text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body hover:text-accent transition-colors"
      >
        Forgot password?
      </Link>
    </form>
  );
}
