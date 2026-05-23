"use client";

import { useRef, useTransition } from "react";
import { createFamily } from "./actions";
import { FormField, SelectField } from "@/app/shared/FormField";
import { Button } from "@/app/shared/Button";

export function AddFamilyForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function scrollToNewFamily(existingIds: Set<string | undefined>) {
    const observer = new MutationObserver(() => {
      const allFamilies = document.querySelectorAll<HTMLElement>("[data-family-id]");
      const newFamily = Array.from(allFamilies).find(
        (el) => !existingIds.has(el.dataset.familyId),
      );
      if (newFamily) {
        observer.disconnect();
        newFamily.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => observer.disconnect(), 5000);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const existingIds = new Set(
      Array.from(document.querySelectorAll<HTMLElement>("[data-family-id]")).map(
        (el) => el.dataset.familyId,
      ),
    );
    startTransition(async () => {
      await createFamily(formData);
      formRef.current?.reset();
      scrollToNewFamily(existingIds);
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-3"
    >
      <FormField
        label="Emails (optional)"
        name="emails"
        placeholder="alice@example.com, bob@example.com"
      />
      <SelectField label="Side" name="side" defaultValue="BRIDE">
        <option value="BRIDE">Bride</option>
        <option value="GROOM">Groom</option>
      </SelectField>
      <FormField
        label="Phone (optional)"
        name="phone"
        placeholder="+1 555 0100"
      />
      <Button type="submit" pending={pending}>
        {pending ? "..." : "Add family"}
      </Button>
    </form>
  );
}
