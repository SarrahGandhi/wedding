"use client";

import { useState, useTransition } from "react";
import {
  createGuest,
  updateFamily,
  appendFamilyEmail,
  deleteFamily,
} from "./actions";
import { GuestRow } from "./GuestRow";
import type { GuestCategory, GuestSide } from "@/lib/types";

type Family = {
  id: number;
  side: GuestSide;
  email: string[];
  phone: string | null;
};

type Guest = {
  id: number;
  name: string;
  category: GuestCategory;
  family_id: number;
};

type FamilyOption = {
  id: number;
  side: GuestSide;
  label: string;
};

export function FamilySection({
  family,
  guests,
  familyOptions,
  label,
}: {
  family: Family;
  guests: Guest[];
  familyOptions: FamilyOption[];
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [appendEmail, setAppendEmail] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onUpdateFamily(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateFamily(formData);
      if (result.error) setError(result.error);
      else setEditing(false);
    });
  }

  function onAppendEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await appendFamilyEmail(formData);
      if (result.error) setError(result.error);
      else setAppendEmail("");
    });
  }

  function onDeleteFamily(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !confirm(
        `Delete family "${label}"? This cannot be undone. Guests linked to it must be moved or deleted first.`
      )
    )
      return;
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await deleteFamily(formData);
      if (result.error) setError(result.error);
    });
  }

  return (
    <article
      className={`border-t border-border/40 py-8 ${pending ? "opacity-60" : ""}`}
    >
      {/* Family heading */}
      <header className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-5">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h2 className="font-display italic text-2xl md:text-3xl text-foreground leading-tight">
            {label}
          </h2>
          <span className="text-[10px] tracking-[0.3em] uppercase text-accent font-body">
            {family.side === "BRIDE" ? "Bride's side" : "Groom's side"}
          </span>
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted font-body tabular-nums">
            #{family.id}
          </span>
        </div>
        <div className="flex items-center gap-5 text-[10px] tracking-[0.25em] uppercase font-body">
          <span className="text-text-secondary tabular-nums">
            {guests.length} {guests.length === 1 ? "guest" : "guests"}
          </span>
          <button
            type="button"
            onClick={() => {
              setEditing((v) => !v);
              setError(null);
            }}
            className="text-text-secondary hover:text-accent transition-colors cursor-pointer"
          >
            {editing ? "Cancel" : "Edit family"}
          </button>
          <form onSubmit={onDeleteFamily} className="inline">
            <input type="hidden" name="id" value={family.id} />
            <button
              type="submit"
              disabled={pending}
              className="text-text-secondary hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40"
            >
              Delete
            </button>
          </form>
        </div>
      </header>

      {/* Family details (edit OR view) */}
      {editing ? (
        <form
          onSubmit={onUpdateFamily}
          className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end mb-6"
        >
          <input type="hidden" name="id" value={family.id} />
          <label className="block md:col-span-2">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Emails (comma separated · replaces all)
            </span>
            <input
              name="emails"
              defaultValue={family.email.join(", ")}
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
              defaultValue={family.side}
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
            >
              <option value="BRIDE">Bride</option>
              <option value="GROOM">Groom</option>
            </select>
          </label>
          <label className="block md:col-span-2">
            <span className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
              Phone (optional)
            </span>
            <input
              name="phone"
              defaultValue={family.phone ?? ""}
              placeholder="+1 555 0100"
              className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="px-5 py-2 bg-foreground text-background text-[10px] tracking-[0.3em] uppercase font-body hover:bg-accent transition-colors disabled:opacity-40 cursor-pointer self-end"
          >
            {pending ? "…" : "Save"}
          </button>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-x-8 gap-y-3 items-start mb-6">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted font-body mb-2">
              Emails on file
            </p>
            {family.email.length === 0 ? (
              <p className="text-sm text-muted italic font-body">
                None — guests will provide these themselves
              </p>
            ) : (
              <ul className="space-y-1">
                {family.email.map((e) => (
                  <li
                    key={e}
                    className="text-sm font-body text-foreground tabular-nums"
                  >
                    {e}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted font-body mb-2">
              Phone
            </p>
            <p className="text-sm font-body text-foreground tabular-nums">
              {family.phone || (
                <span className="text-muted italic">Not on file</span>
              )}
            </p>
          </div>
          <form
            onSubmit={onAppendEmail}
            className="flex items-end gap-2 self-end justify-self-end"
          >
            <input type="hidden" name="id" value={family.id} />
            <label className="block">
              <span className="text-[10px] tracking-[0.25em] uppercase text-muted font-body">
                Append email
              </span>
              <input
                name="email"
                type="email"
                value={appendEmail}
                onChange={(e) => setAppendEmail(e.target.value)}
                placeholder="new@example.com"
                className="mt-1 bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
              />
            </label>
            <button
              type="submit"
              disabled={pending || !appendEmail.trim()}
              className="px-3 py-2 border border-border text-text-secondary hover:text-accent hover:border-accent text-[10px] tracking-[0.25em] uppercase font-body transition-colors disabled:opacity-40 cursor-pointer"
            >
              + Add
            </button>
          </form>
        </div>
      )}

      {/* Guests in this family */}
      {guests.length === 0 ? (
        <p className="text-sm text-muted italic font-body mb-4">
          No guests yet in this family — add the first one below.
        </p>
      ) : (
        <table className="w-full border-collapse mb-4">
          <thead>
            <tr className="border-b border-border/40">
              <th className="text-left py-2 px-2 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                Name
              </th>
              <th className="text-left py-2 px-2 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                Category
              </th>
              <th className="text-left py-2 px-2 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                Family
              </th>
              <th className="text-left py-2 px-2 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                ID
              </th>
              <th className="text-right py-2 px-2 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {guests.map((g) => (
              <GuestRow key={g.id} guest={g} families={familyOptions} />
            ))}
          </tbody>
        </table>
      )}

      {/* Add a guest to this family */}
      <form
        action={createGuest}
        className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3 items-end pt-2"
      >
        <input type="hidden" name="family_id" value={family.id} />
        <label className="block">
          <span className="text-[10px] tracking-[0.25em] uppercase text-muted font-body">
            Add guest · Name
          </span>
          <input
            name="name"
            required
            placeholder="Full name"
            className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
          />
        </label>
        <label className="block">
          <span className="text-[10px] tracking-[0.25em] uppercase text-muted font-body">
            Category
          </span>
          <select
            name="category"
            defaultValue="FEMALE"
            className="mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="CHILD">Child</option>
          </select>
        </label>
        <button
          type="submit"
          className="px-4 py-2 border border-border text-text-secondary hover:text-accent hover:border-accent text-[10px] tracking-[0.25em] uppercase font-body transition-colors cursor-pointer"
        >
          + Add guest
        </button>
      </form>

      {error && (
        <p className="mt-3 text-xs text-red-500 font-body">{error}</p>
      )}
    </article>
  );
}
