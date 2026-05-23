"use client";

import { useActionState } from "react";
import { setPasswordAction, type SetPasswordState } from "./actions";
import { FormField } from "@/app/shared/FormField";
import { Button } from "@/app/shared/Button";
import { ErrorMessage } from "@/app/shared/ErrorMessage";

export function SetPasswordForm() {
  const [state, formAction, pending] = useActionState<
    SetPasswordState,
    FormData
  >(setPasswordAction, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <FormField
        label="Password"
        size="lg"
        type="password"
        name="password"
        required
        minLength={6}
        autoComplete="new-password"
        autoFocus
        disabled={pending}
      />

      <FormField
        label="Confirm Password"
        size="lg"
        type="password"
        name="confirm"
        required
        minLength={6}
        autoComplete="new-password"
        disabled={pending}
      />

      {state?.error && <ErrorMessage>{state.error}</ErrorMessage>}

      <Button type="submit" variant="block" pending={pending}>
        {pending ? "Saving…" : "Set password"}
      </Button>
    </form>
  );
}
