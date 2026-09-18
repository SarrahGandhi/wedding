"use client";

import { useState } from "react";
import {
  createGuest,
  updateFamily,
  appendFamilyEmail,
  deleteFamily,
} from "./actions";
import { GuestRow } from "./GuestRow";
import type { GuestCategory, GuestSide } from "@/lib/types";
import { FormField, SelectField } from "@/app/shared/FormField";
import { Button } from "@/app/shared/Button";
import { ErrorMessage } from "@/app/shared/ErrorMessage";
import { useServerAction } from "@/app/shared/useServerAction";

type Family = {
  id: number;
  side: GuestSide;
  email: string[];
  phone: string | null;
  family_name: string | null;
  male_guest_slots: number;
  female_guest_slots: number;
  allow_all_guests: boolean;
};

type Guest = {
  id: number;
  name: string;
  category: GuestCategory;
  family_id: number;
  added_by_family: boolean;
};

export function FamilySection({
  family,
  guests,
  label,
  expanded,
  onExpandedChange,
}: {
  family: Family;
  guests: Guest[];
  label: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editingAllowAll, setEditingAllowAll] = useState(
    family.allow_all_guests,
  );
  const [appendEmail, setAppendEmail] = useState("");
  const update = useServerAction(updateFamily);
  const append = useServerAction(appendFamilyEmail);
  const remove = useServerAction(deleteFamily);
  const pending = update.pending || append.pending || remove.pending;
  const error = update.error || append.error || remove.error;
  const familyAddedMale = guests.filter(
    (guest) => guest.added_by_family && guest.category === "MALE",
  ).length;
  const familyAddedFemale = guests.filter(
    (guest) => guest.added_by_family && guest.category === "FEMALE",
  ).length;

  function onUpdateFamily(e: React.FormEvent<HTMLFormElement>) {
    update.runForm(e, { onSuccess: () => setEditing(false) });
  }

  function onAppendEmail(e: React.FormEvent<HTMLFormElement>) {
    append.runForm(e, { onSuccess: () => setAppendEmail("") });
  }

  function onDeleteFamily(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // A guest cannot exist without a family, so the database refuses this too —
    // say why here rather than spending a round trip to be told no.
    if (guests.length > 0) {
      remove.setError(
        `"${label}" still has ${guests.length} ${guests.length === 1 ? "guest" : "guests"}. Delete them first.`,
      );
      return;
    }
    if (!confirm(`Delete family "${label}"? This cannot be undone.`)) return;
    remove.run(new FormData(e.currentTarget));
  }

  return (
    <article
      id={`family-${family.id}`}
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
          <Button
            variant="ghost"
            aria-expanded={expanded}
            aria-controls={`family-${family.id}-details`}
            onClick={() => onExpandedChange(!expanded)}
          >
            {expanded ? "Hide details" : "Show details"}
          </Button>
          {expanded && (
            <Button
              variant="ghost"
              onClick={() => {
                setEditing((current) => {
                  if (!current) setEditingAllowAll(family.allow_all_guests);
                  return !current;
                });
                update.setError(null);
              }}
            >
              {editing ? "Cancel" : "Edit family"}
            </Button>
          )}
          <form onSubmit={onDeleteFamily} className="inline">
            <input type="hidden" name="id" value={family.id} />
            <Button variant="danger" type="submit" disabled={pending}>
              Delete
            </Button>
          </form>
        </div>
      </header>

      {expanded && (
        <div id={`family-${family.id}-details`}>
          {/* Family details (edit OR view) */}
          {editing ? (
            <form
              onSubmit={onUpdateFamily}
              className="mb-6 border border-border/50 bg-warm-white/60 p-4 md:p-5"
            >
              <input type="hidden" name="id" value={family.id} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  label="Family name (optional)"
                  name="family_name"
                  defaultValue={family.family_name ?? ""}
                  placeholder="The Rahman family"
                  maxLength={100}
                />
                <SelectField
                  label="Side"
                  name="side"
                  defaultValue={family.side}
                >
                  <option value="BRIDE">Bride</option>
                  <option value="GROOM">Groom</option>
                </SelectField>
                <FormField
                  label="Emails (comma separated · replaces all)"
                  name="emails"
                  defaultValue={family.email.join(", ")}
                  placeholder="alice@example.com, bob@example.com"
                />
                <FormField
                  label="Phone (optional)"
                  name="phone"
                  defaultValue={family.phone ?? ""}
                  placeholder="+1 555 0100"
                />
              </div>

              <div className="mt-5 border-t border-border/40 pt-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-1">
                      Guest-added names
                    </p>
                    <p className="text-xs text-muted font-body leading-relaxed">
                      Set fixed spots, or let this family add everyone.
                    </p>
                  </div>
                  <Button
                    variant={editingAllowAll ? "primary" : "secondary"}
                    aria-pressed={editingAllowAll}
                    onClick={() => setEditingAllowAll((current) => !current)}
                  >
                    All
                  </Button>
                </div>
                <input
                  type="hidden"
                  name="allow_all_guests"
                  value={String(editingAllowAll)}
                />
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField
                    label="Men"
                    name="male_guest_slots"
                    type="number"
                    min={0}
                    max={20}
                    step={1}
                    defaultValue={family.male_guest_slots}
                    disabled={editingAllowAll}
                    placeholder={editingAllowAll ? "Unlimited" : "0"}
                    labelTone="muted"
                  />
                  <FormField
                    label="Women"
                    name="female_guest_slots"
                    type="number"
                    min={0}
                    max={20}
                    step={1}
                    defaultValue={family.female_guest_slots}
                    disabled={editingAllowAll}
                    placeholder={editingAllowAll ? "Unlimited" : "0"}
                    labelTone="muted"
                  />
                </div>
              </div>

              <div className="mt-5">
                <Button type="submit" pending={pending}>
                  {pending ? "…" : "Save changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="mb-6">
              <div className="mb-5 border border-border/40 bg-warm-white/50 px-4 py-3">
                <p className="text-[10px] tracking-[0.25em] uppercase text-muted font-body mb-1">
                  Guest-added names
                </p>
                <p className="text-sm font-body text-foreground">
                  {family.allow_all_guests
                    ? "All — this family can add any number of people"
                    : family.male_guest_slots > 0 ||
                        family.female_guest_slots > 0
                      ? `${Math.max(0, family.male_guest_slots - familyAddedMale)} of ${family.male_guest_slots} men · ${Math.max(0, family.female_guest_slots - familyAddedFemale)} of ${family.female_guest_slots} women remaining`
                      : "Off"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-x-8 gap-y-3 items-start">
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
                <FormField
                  label="Append email"
                  name="email"
                  type="email"
                  value={appendEmail}
                  onChange={(e) => setAppendEmail(e.target.value)}
                  placeholder="new@example.com"
                  labelTone="muted"
                  className="w-auto"
                />
                <Button
                  variant="secondary"
                  type="submit"
                  disabled={pending || !appendEmail.trim()}
                  className="px-3"
                >
                  + Add
                </Button>
              </form>
              </div>
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
                    ID
                  </th>
                  <th className="text-right py-2 px-2 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary font-normal">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {guests
                  .sort((a, b) => a.id - b.id)
                  .map((g) => (
                    <GuestRow key={g.id} guest={g} />
                  ))}
              </tbody>
            </table>
          )}

          {/* Add a guest to this family */}
          <form
            action={createGuest}
            className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3 pt-2"
          >
            <input type="hidden" name="family_id" value={family.id} />
            <FormField
              label="Add guest · Name"
              name="name"
              required
              placeholder="Full name"
              labelTone="muted"
            />
            <SelectField
              label="Category"
              name="category"
              defaultValue="FEMALE"
              labelTone="muted"
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="CHILD">Child</option>
            </SelectField>
            <Button variant="secondary" type="submit" className="self-end">
              + Add guest
            </Button>
          </form>

        </div>
      )}

      {/* Outside the `expanded` block: Delete is reachable while collapsed, so
          its error has to be too. */}
      {error && (
        <ErrorMessage variant="inline" className="mt-3">
          {error}
        </ErrorMessage>
      )}
    </article>
  );
}
