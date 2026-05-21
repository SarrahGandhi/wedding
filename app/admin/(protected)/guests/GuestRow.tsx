"use client";

import { useState, useTransition } from "react";
import { updateGuest, deleteGuest } from "./actions";
import { BabyIcon, MarsIcon, VenusIcon } from "lucide-react";
import type { GuestCategory } from "@/lib/types";

type Guest = {
  id: number;
  name: string;
  category: GuestCategory;
  family_id: number;
};

const categoryGlyph: Record<Guest["category"], React.ReactNode> = {
  MALE: <MarsIcon className="inline mb-1" />,
  FEMALE: <VenusIcon className="inline mb-1" />,
  CHILD: <BabyIcon className="inline mb-1" />,
};

export function GuestRow({ guest }: { guest: Guest }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateGuest(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
      }
    });
  }

  function onDelete() {
    if (!confirm(`Delete guest "${guest.name}"? This cannot be undone.`))
      return;
    const formData = new FormData();
    formData.set("id", String(guest.id));
    startTransition(async () => {
      const result = await deleteGuest(formData);
      if (result.error) setError(result.error);
    });
  }

  if (editing) {
    return (
      <tr
        className={`border-b border-border/30 ${pending ? "opacity-60" : ""}`}
      >
        <td colSpan={4} className="py-4">
          <form
            onSubmit={onSubmit}
            className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3 items-end"
          >
            <input type="hidden" name="id" value={guest.id} />
            <label className="block">
              <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
                Name
              </span>
              <input
                name="name"
                defaultValue={guest.name}
                required
                className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
              />
            </label>
            <label className="block">
              <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
                Category
              </span>
              <select
                name="category"
                defaultValue={guest.category}
                className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="CHILD">Child</option>
              </select>
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={pending}
                className="px-4 py-2 bg-foreground text-background text-[10px] tracking-[0.25em] uppercase font-body hover:bg-accent transition-colors disabled:opacity-40 cursor-pointer"
              >
                {pending ? "…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setError(null);
                }}
                disabled={pending}
                className="px-4 py-2 border border-border text-text-secondary text-[10px] tracking-[0.25em] uppercase font-body hover:text-foreground transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
            {error && (
              <p className="md:col-span-3 text-xs text-red-500 font-body">
                {error}
              </p>
            )}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr
      className={`border-b border-border/30 hover:bg-cream/30 transition-colors ${pending ? "opacity-60" : ""}`}
    >
      <td className="py-4 px-2 font-display text-lg text-foreground">
        {guest.name}
      </td>
      <td className="py-4 px-2 text-sm text-text-secondary font-body">
        <span className="text-base text-accent mr-2">
          {categoryGlyph[guest.category]}
        </span>
        {guest.category.charAt(0) + guest.category.slice(1).toLowerCase()}
      </td>
      <td className="py-4 px-2 text-[10px] tracking-[0.25em] uppercase font-body text-text-secondary tabular-nums">
        #{guest.id}
      </td>
      <td className="py-4 px-2 text-right">
        <div className="inline-flex items-center gap-4">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[10px] tracking-[0.25em] uppercase font-body text-text-secondary hover:text-accent transition-colors cursor-pointer"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="text-[10px] tracking-[0.25em] uppercase font-body text-text-secondary hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40"
          >
            Delete
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-500 font-body mt-1">{error}</p>
        )}
      </td>
    </tr>
  );
}
