"use client";

import { useEffect, useRef, useState, useTransition, type Ref } from "react";
import { ArrowRight } from "lucide-react";
import { createFamily } from "./actions";
import { FormField, SelectField } from "@/app/shared/FormField";
import { Button } from "@/app/shared/Button";
import { ErrorMessage } from "@/app/shared/ErrorMessage";
import type { GuestCategory, GuestSide } from "@/lib/types";

export type CreatedFamily = { id: number; label: string; side: GuestSide };

type GuestRow = { key: number; name: string; category: GuestCategory };

let nextRowKey = 0;
function blankRow(): GuestRow {
  return { key: nextRowKey++, name: "", category: "FEMALE" };
}

export function AddFamilyForm({
  open,
  onCreated,
  focusNonce,
}: {
  open: boolean;
  onCreated: (family: CreatedFamily) => void;
  focusNonce: number;
}) {
  const firstFieldRef = useRef<HTMLSelectElement>(null);
  const [side, setSide] = useState<GuestSide>("BRIDE");
  const [familyName, setFamilyName] = useState("");
  const [emails, setEmails] = useState("");
  const [phone, setPhone] = useState("");
  const [maleGuestSlots, setMaleGuestSlots] = useState("");
  const [femaleGuestSlots, setFemaleGuestSlots] = useState("");
  const [allowAllGuests, setAllowAllGuests] = useState(false);
  const [rows, setRows] = useState<GuestRow[]>(() => [blankRow()]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Bumped by the floating button so it can open the form and land the caret.
  useEffect(() => {
    if (focusNonce > 0) firstFieldRef.current?.focus({ preventScroll: true });
  }, [focusNonce]);

  function updateRow(key: number, patch: Partial<GuestRow>) {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function removeRow(key: number) {
    setRows((current) =>
      current.length === 1 ? [blankRow()] : current.filter((r) => r.key !== key),
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createFamily(formData);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onCreated({ id: result.id, label: result.label, side: result.side });
      // `side` intentionally persists — families are usually entered in batches
      // for one side at a time.
      setFamilyName("");
      setEmails("");
      setPhone("");
      setMaleGuestSlots("");
      setFemaleGuestSlots("");
      setAllowAllGuests(false);
      setRows([blankRow()]);
      firstFieldRef.current?.focus({ preventScroll: true });
    });
  }

  return (
    <div className={open ? "" : "hidden"}>
      <form onSubmit={onSubmit} className={pending ? "opacity-60" : ""}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SelectField
            label="Side"
            name="side"
            value={side}
            onChange={(e) => setSide(e.target.value as GuestSide)}
            ref={firstFieldRef}
          >
            <option value="BRIDE">Bride</option>
            <option value="GROOM">Groom</option>
          </SelectField>
          <FormField
            label="Family name (optional)"
            name="family_name"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            placeholder="The Rahman family"
            maxLength={100}
          />
          <FormField
            label="Phone (optional)"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 555 0100"
          />
          <FormField
            label="Emails (optional)"
            name="emails"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="alice@example.com, bob@example.com"
          />
        </div>

        <div className="mt-6 border border-border/50 bg-warm-white/60 p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-1">
                Guest-added names (optional)
              </p>
              <p className="max-w-[65ch] text-xs text-muted font-body leading-relaxed">
                Use fixed spots when you know the number of men and women, or
                choose All so the family can add any number of people.
              </p>
            </div>
            <Button
              variant={allowAllGuests ? "primary" : "secondary"}
              aria-pressed={allowAllGuests}
              onClick={() => setAllowAllGuests((current) => !current)}
              className="shrink-0"
            >
              All
            </Button>
          </div>

          <input
            type="hidden"
            name="allow_all_guests"
            value={String(allowAllGuests)}
          />

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              label="Men"
              name="male_guest_slots"
              type="number"
              inputMode="numeric"
              min={0}
              max={20}
              step={1}
              value={allowAllGuests ? "" : maleGuestSlots}
              onChange={(e) => setMaleGuestSlots(e.target.value)}
              placeholder={allowAllGuests ? "Unlimited" : "0"}
              disabled={allowAllGuests}
              labelTone="muted"
            />
            <FormField
              label="Women"
              name="female_guest_slots"
              type="number"
              inputMode="numeric"
              min={0}
              max={20}
              step={1}
              value={allowAllGuests ? "" : femaleGuestSlots}
              onChange={(e) => setFemaleGuestSlots(e.target.value)}
              placeholder={allowAllGuests ? "Unlimited" : "0"}
              disabled={allowAllGuests}
              labelTone="muted"
            />
          </div>

          {(allowAllGuests || maleGuestSlots || femaleGuestSlots) && (
            <p className="mt-3 text-xs text-text-secondary font-body leading-relaxed">
              Add a family name above so guests can find this invitation.
            </p>
          )}
        </div>

        <div className="mt-6">
          <p className="text-[10px] tracking-[0.3em] uppercase text-text-secondary font-body mb-3">
            Guests in this family
          </p>
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div
                key={row.key}
                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-3 items-end"
              >
                <FormField
                  label={`Guest ${index + 1} · Name`}
                  name="guest_name"
                  value={row.name}
                  onChange={(e) => updateRow(row.key, { name: e.target.value })}
                  placeholder="Full name"
                  labelTone="muted"
                />
                <SelectField
                  label="Category"
                  name="guest_category"
                  value={row.category}
                  onChange={(e) =>
                    updateRow(row.key, {
                      category: e.target.value as GuestCategory,
                    })
                  }
                  labelTone="muted"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="CHILD">Child</option>
                </SelectField>
                <Button
                  variant="ghost"
                  onClick={() => removeRow(row.key)}
                  aria-label={`Remove guest ${index + 1}`}
                  className="pb-2"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <Button
              variant="secondary"
              onClick={() => setRows((current) => [...current, blankRow()])}
            >
              + Add another guest
            </Button>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Button type="submit" pending={pending}>
            {pending ? "…" : "Create family"}
          </Button>
          <span className="text-xs text-muted italic font-body">
            Blank guest rows are ignored — a family with none is fine.
          </span>
        </div>

        {error && (
          <ErrorMessage variant="inline" className="mt-3">
            {error}
          </ErrorMessage>
        )}
      </form>
    </div>
  );
}

// Kept next to the form since it only makes sense alongside it.
export function CreatedFamilyLinks({
  created,
  onJump,
  headingRef,
}: {
  created: CreatedFamily[];
  onJump: (id: number) => void;
  // The workspace centres this after a create. It sits on the heading rather
  // than the wrapper because the list grows past a phone viewport after a few
  // families, and centring a box taller than the screen pushes its top — where
  // the newest family is prepended — back out of view.
  headingRef?: Ref<HTMLParagraphElement>;
}) {
  if (created.length === 0) return null;
  return (
    <div className="mt-8 pt-6 border-t border-border/40">
      <p
        ref={headingRef}
        className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-2"
      >
        Created this session
      </p>
      <div className="w-10 h-px bg-accent/40 mb-3" />
      <p className="text-xs text-text-secondary font-body italic mb-4 leading-relaxed">
        Click any family below to filter the roster down to just that one. This
        list keeps growing as you add families and only clears on refresh.
      </p>
      <ul className="space-y-2">
        {created.map((family) => (
          <li key={family.id}>
            <button
              type="button"
              onClick={() => onJump(family.id)}
              className="group w-full flex items-center gap-x-4 gap-y-2 flex-wrap border border-border/60 bg-warm-white px-4 py-3.5 text-left hover:border-accent hover:bg-accent/5 transition-colors cursor-pointer"
            >
              <span className="font-body text-sm text-foreground group-hover:text-accent transition-colors">
                {family.label}
              </span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-muted font-body">
                {family.side === "BRIDE" ? "Bride's side" : "Groom's side"}
              </span>
              <span className="text-[10px] tracking-[0.3em] uppercase text-muted font-body tabular-nums">
                #{family.id}
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase font-body text-text-secondary group-hover:text-accent transition-colors">
                Jump to it
                <ArrowRight
                  size={13}
                  strokeWidth={1.5}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
