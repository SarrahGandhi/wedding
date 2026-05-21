"use client";

import { useRef, useTransition } from "react";
import { createFamily } from "./actions";

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
      <label className="block">
        <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
          Emails (optional)
        </span>
        <input
          name="emails"
          placeholder="alice@example.com, bob@example.com"
          className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
        />
      </label>
      <label className="block">
        <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
          Side
        </span>
        <select
          name="side"
          defaultValue="BRIDE"
          className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
        >
          <option value="BRIDE">Bride</option>
          <option value="GROOM">Groom</option>
        </select>
      </label>
      <label className="block">
        <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
          Phone (optional)
        </span>
        <input
          name="phone"
          placeholder="+1 555 0100"
          className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="px-5 py-2 bg-foreground text-background text-[10px] tracking-[0.3em] uppercase font-body hover:bg-accent transition-colors cursor-pointer disabled:opacity-40"
      >
        {pending ? "..." : "Add family"}
      </button>
    </form>
  );
}
