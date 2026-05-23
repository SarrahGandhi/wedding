"use client";

import { useState } from "react";
import { updateGuest, deleteGuest } from "./actions";
import { BabyIcon, MarsIcon, VenusIcon } from "lucide-react";
import type { GuestCategory } from "@/lib/types";
import { FormField, SelectField } from "@/app/shared/FormField";
import { Button } from "@/app/shared/Button";
import { ErrorMessage } from "@/app/shared/ErrorMessage";
import { useServerAction } from "@/app/shared/useServerAction";

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
  const update = useServerAction(updateGuest);
  const remove = useServerAction(deleteGuest);
  const pending = update.pending || remove.pending;
  const error = update.error || remove.error;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    update.runForm(e, { onSuccess: () => setEditing(false) });
  }

  function onDelete() {
    if (!confirm(`Delete guest "${guest.name}"? This cannot be undone.`))
      return;
    const formData = new FormData();
    formData.set("id", String(guest.id));
    remove.run(formData);
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
            <FormField
              label="Name"
              name="name"
              defaultValue={guest.name}
              required
            />
            <SelectField
              label="Category"
              name="category"
              defaultValue={guest.category}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="CHILD">Child</option>
            </SelectField>
            <div className="flex gap-2">
              <Button type="submit" pending={pending} className="px-4 tracking-[0.25em]">
                {pending ? "…" : "Save"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setEditing(false);
                  update.setError(null);
                }}
                disabled={pending}
                className="hover:text-foreground hover:border-border"
              >
                Cancel
              </Button>
            </div>
            {error && (
              <ErrorMessage variant="inline" className="md:col-span-3">
                {error}
              </ErrorMessage>
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
          <Button variant="ghost" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="danger" onClick={onDelete} disabled={pending}>
            Delete
          </Button>
        </div>
        {error && (
          <ErrorMessage variant="inline" className="mt-1">
            {error}
          </ErrorMessage>
        )}
      </td>
    </tr>
  );
}
