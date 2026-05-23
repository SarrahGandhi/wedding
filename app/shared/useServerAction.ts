"use client";

import { useState, useTransition } from "react";

type ActionResult = { error?: string } | { success: unknown } | void;
type ServerAction = (formData: FormData) => Promise<ActionResult>;

type RunOptions = {
  onSuccess?: () => void;
  onError?: (message: string) => void;
};

export function useServerAction(action: ServerAction) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(formData: FormData, { onSuccess, onError }: RunOptions = {}) {
    setError(null);
    startTransition(async () => {
      const result = await action(formData);
      if (result && "error" in result && result.error) {
        setError(result.error);
        onError?.(result.error);
      } else {
        onSuccess?.();
      }
    });
  }

  function runForm(
    e: React.FormEvent<HTMLFormElement>,
    options?: RunOptions,
  ) {
    e.preventDefault();
    run(new FormData(e.currentTarget), options);
  }

  return { pending, error, setError, run, runForm };
}
