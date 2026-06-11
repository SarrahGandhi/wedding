"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  Mail,
  MapPin,
  PartyPopper,
  Search,
  Shirt,
  Sparkles,
} from "lucide-react";
import {
  searchGuests,
  getFamilyInvitationByFamilyId,
  updateRsvpStatus,
  updateRsvpStatusBulk,
  addFamilyEmail,
  type GuestSearchHit,
  type FamilyInvitation,
  type EventRsvp,
} from "./actions";
import type { RsvpStatus } from "@/lib/types";

/* Pastel palettes cycled across event cards, mirroring the
   three-day cards on the home page. */
const EVENT_PALETTES = [
  { card: "from-blush to-mint", accent: "text-rose", numeral: "text-rose" },
  { card: "from-sky to-peach", accent: "text-bluebell", numeral: "text-bluebell" },
  { card: "from-warm-white to-powder", accent: "text-deepblue", numeral: "text-deepblue" },
];

/* Pastel monogram tints cycled across search result cards. */
const AVATAR_TINTS = [
  "bg-blush text-rose",
  "bg-mint text-leaf",
  "bg-sky text-bluebell",
  "bg-peach text-tangerine",
];

const CONFETTI = [
  { top: "22%", left: "14%", color: "bg-rose/50", delay: "0s" },
  { top: "30%", left: "84%", color: "bg-bluebell/40", delay: "-2s" },
  { top: "68%", left: "8%", color: "bg-tangerine/40", delay: "-4s" },
  { top: "74%", left: "88%", color: "bg-leaf/40", delay: "-1s" },
];

const firstName = (name: string) => name.split(" ")[0];

function formatNameList(names: string[]) {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/* Fixed full-viewport pastel atmosphere — sits behind the whole page
   (and stays put while scrolling) instead of being clipped to the hero. */
function PageBackdrop() {
  return (
    <div
      aria-hidden
      className="grain fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] rounded-full bg-blush opacity-80 blur-3xl animate-drift" />
      <div
        className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] rounded-full bg-sky opacity-80 blur-3xl animate-drift"
        style={{ animationDelay: "-6s" }}
      />
      <div
        className="absolute -bottom-32 -left-24 w-[26rem] h-[26rem] rounded-full bg-mint opacity-70 blur-3xl animate-drift"
        style={{ animationDelay: "-11s" }}
      />
      <div
        className="absolute -bottom-28 right-[15%] w-[24rem] h-[24rem] rounded-full bg-peach opacity-70 blur-3xl animate-drift"
        style={{ animationDelay: "-3s" }}
      />
      {CONFETTI.map((dot, i) => (
        <span
          key={i}
          className={`absolute rounded-full ${dot.color} w-2 h-2 animate-bob hidden sm:block`}
          style={{ top: dot.top, left: dot.left, animationDelay: dot.delay }}
        />
      ))}
    </div>
  );
}

function NameHeading({ names }: { names: string[] }) {
  return (
    <>
      {names.map((name, i) => (
        <span key={i}>
          {i > 0 && (
            <span className="text-rose italic font-normal">
              {i === names.length - 1 ? " & " : ", "}
            </span>
          )}
          {name}
        </span>
      ))}
    </>
  );
}

function RsvpPill({
  label,
  active,
  disabled,
  variant,
  onClick,
}: {
  label: string;
  active: boolean;
  disabled?: boolean;
  variant: "accept" | "decline";
  onClick: () => void;
}) {
  const styles =
    variant === "accept"
      ? active
        ? "bg-leaf text-warm-white border-leaf shadow-[0_10px_20px_-10px_var(--leaf)]"
        : "bg-white/50 border-leaf/40 text-leaf hover:bg-white"
      : active
        ? "bg-foreground/80 text-warm-white border-foreground/80"
        : "bg-white/50 border-foreground/15 text-text-secondary hover:bg-white";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-body px-4 py-2 rounded-full border transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-default ${styles}`}
    >
      {active && <Check className="w-3 h-3" strokeWidth={2.5} />}
      {label}
    </button>
  );
}

function RsvpProgress({ answered, total }: { answered: number; total: number }) {
  if (total === 0) return null;

  if (answered === total) {
    return (
      <div className="flex items-center justify-center gap-3 rounded-full bg-mint border border-white/70 shadow-[0_14px_30px_-18px_rgba(90,80,90,0.35)] px-6 py-3.5 animate-scale-in">
        <PartyPopper className="w-4 h-4 text-leaf shrink-0" strokeWidth={1.5} />
        <p className="text-[11px] tracking-[0.2em] uppercase font-body text-leaf">
          All replies in — we can&apos;t wait to celebrate with you
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-full bg-warm-white/80 border border-white/70 shadow-[0_14px_30px_-18px_rgba(90,80,90,0.35)] px-5 py-3">
      <span className="text-[11px] tracking-[0.2em] uppercase text-text-secondary font-body whitespace-nowrap">
        {answered} of {total} replies in
      </span>
      <div className="flex-1 h-2 rounded-full bg-powder overflow-hidden">
        <div
          className="h-full rounded-full bg-linear-to-r from-rose to-bluebell transition-[width] duration-500 ease-out"
          style={{ width: `${Math.round((answered / total) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function EmailCard({
  familyId,
  onSuccess,
}: {
  familyId: number;
  onSuccess: (msg: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [addedEmails, setAddedEmails] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || adding) return;
    setError(null);
    setAdding(true);
    const result = await addFamilyEmail(familyId, trimmed);
    setAdding(false);
    if (result.success) {
      setAddedEmails((prev) =>
        prev.includes(trimmed) ? prev : [...prev, trimmed]
      );
      setEmail("");
      onSuccess("Email added — we'll keep you posted");
    } else {
      setError(result.error ?? "Failed to add email");
    }
  }

  return (
    <div className="rounded-3xl bg-warm-white/80 border border-white/70 shadow-[0_18px_40px_-20px_rgba(90,80,90,0.35)] p-7 md:p-8">
      <div className="flex items-center gap-3 mb-2">
        <span className="flex items-center justify-center w-9 h-9 rounded-full bg-powder shrink-0">
          <Mail className="w-4 h-4 text-deepblue" strokeWidth={1.5} />
        </span>
        <h3 className="font-display text-2xl font-light text-foreground">
          Stay in the loop
        </h3>
      </div>
      <p className="text-sm text-text-secondary font-body leading-relaxed mb-5">
        Add an email and we&apos;ll send updates and details as the days get
        closer. You can add more than one for your party.
      </p>

      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="email@example.com"
          className="flex-1 min-w-0 rounded-full bg-white/70 border border-white/80 px-5 py-3 text-sm font-body text-foreground placeholder:text-muted focus:outline-none focus:border-bluebell/50 transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !email.trim()}
          className="px-5 py-3 rounded-full bg-deepblue text-warm-white text-[10px] tracking-[0.25em] uppercase font-body hover:bg-rose transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-default shrink-0"
        >
          {adding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Add"}
        </button>
      </div>

      {error && <p className="text-xs text-rose font-body mt-2 pl-4">{error}</p>}

      {addedEmails.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {addedEmails.map((addr) => (
            <span
              key={addr}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-mint text-leaf text-xs font-body rounded-full border border-white/70"
            >
              <Check className="w-3 h-3" strokeWidth={2} />
              {addr}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface EventGroup {
  eventName: string;
  eventDate: string;
  eventLocation: string | null;
  eventDressCode: string | null;
  eventDetails: string | null;
  rsvps: EventRsvp[];
}

function EventCard({
  group,
  index,
  pendingIds,
  onUpdateRsvp,
  onAcceptAll,
}: {
  group: EventGroup;
  index: number;
  pendingIds: Set<number>;
  onUpdateRsvp: (rsvpId: number, status: RsvpStatus) => void;
  onAcceptAll: (rsvpIds: number[]) => void;
}) {
  const palette = EVENT_PALETTES[index % EVENT_PALETTES.length];
  const formattedDate = new Date(group.eventDate + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );
  const notAccepted = group.rsvps.filter((r) => r.status !== "ACCEPTED");
  const showAcceptAll = group.rsvps.length > 1 && notAccepted.length > 0;

  return (
    <article
      className={`relative rounded-3xl bg-linear-to-br ${palette.card} border border-white/60 shadow-[0_18px_40px_-20px_rgba(90,80,90,0.35)] p-7 pt-10 md:p-9 md:pt-11`}
    >
      <span
        aria-hidden
        className={`absolute -top-5 left-7 font-display display-wonk italic text-6xl ${palette.numeral} drop-shadow-[0_2px_0_rgba(255,255,255,0.8)]`}
      >
        {index + 1}
      </span>

      <p className={`text-[11px] tracking-[0.3em] uppercase font-body ${palette.accent} mt-4 mb-2`}>
        {formattedDate}
      </p>
      <h3 className="font-display text-3xl text-foreground leading-snug">
        {group.eventName}
      </h3>

      {(group.eventLocation || group.eventDressCode) && (
        <div className="flex flex-wrap gap-2 mt-4">
          {group.eventLocation && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 border border-white/70 px-3 py-1.5 text-xs text-text-secondary font-body">
              <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              {group.eventLocation}
            </span>
          )}
          {group.eventDressCode && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/60 border border-white/70 px-3 py-1.5 text-xs text-text-secondary font-body">
              <Shirt className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
              {group.eventDressCode}
            </span>
          )}
        </div>
      )}

      {group.eventDetails && (
        <p className="text-sm text-text-secondary font-body leading-relaxed mt-4">
          {group.eventDetails}
        </p>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <p className="text-[10px] tracking-[0.25em] uppercase text-text-secondary font-body">
            Who&apos;s coming
          </p>
          {showAcceptAll && (
            <button
              onClick={() => onAcceptAll(notAccepted.map((r) => r.rsvpId))}
              disabled={notAccepted.some((r) => pendingIds.has(r.rsvpId))}
              className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-body text-leaf bg-white/50 border border-leaf/40 rounded-full px-3.5 py-1.5 hover:bg-leaf hover:text-warm-white transition-colors duration-200 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-3 h-3" strokeWidth={2.5} />
              Everyone&apos;s coming
            </button>
          )}
        </div>

        {group.rsvps.map((rsvp) => {
          const pending = pendingIds.has(rsvp.rsvpId);
          return (
            <div
              key={rsvp.rsvpId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 border-t border-white/70"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {rsvp.status === "PENDING" && (
                  <span
                    aria-hidden
                    className="w-1.5 h-1.5 rounded-full bg-tangerine shrink-0"
                  />
                )}
                <span className="font-display text-xl text-foreground truncate">
                  {rsvp.guestName}
                </span>
                {pending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-text-secondary shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <RsvpPill
                  label="Attending"
                  variant="accept"
                  active={rsvp.status === "ACCEPTED"}
                  disabled={pending}
                  onClick={() => onUpdateRsvp(rsvp.rsvpId, "ACCEPTED")}
                />
                <RsvpPill
                  label="Can't make it"
                  variant="decline"
                  active={rsvp.status === "DECLINED"}
                  disabled={pending}
                  onClick={() => onUpdateRsvp(rsvp.rsvpId, "DECLINED")}
                />
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

export function InvitationClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const queryParam = searchParams.get("q");
  const familyParam = searchParams.get("family");

  const [query, setQuery] = useState(queryParam ?? "");
  const [results, setResults] = useState<GuestSearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [invitation, setInvitation] = useState<FamilyInvitation | null>(null);
  const [loadingFamily, setLoadingFamily] = useState(false);
  const [familyNotFound, setFamilyNotFound] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<{
    kind: "success" | "error";
    text: string;
  } | null>(null);

  // Tracks the q value we last wrote to the URL ourselves, so the
  // URL-sync effect only overwrites the input on real navigations
  // (back/forward, deep links) and never mid-typing.
  const lastUrlQuery = useRef(queryParam ?? "");
  // Monotonic counter so a slow, stale search response can't
  // overwrite the results of a newer one.
  const searchSeq = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(kind: "success" | "error", text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ kind, text });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Sync input from the URL on back/forward navigation and deep links.
  useEffect(() => {
    if ((queryParam ?? "") !== lastUrlQuery.current) {
      lastUrlQuery.current = queryParam ?? "";
      setQuery(queryParam ?? "");
    }
  }, [queryParam]);

  // Debounced live search; keeps ?q= in the URL so results survive
  // back navigation and can be shared.
  useEffect(() => {
    if (familyParam) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults(null);
      setSearching(false);
      return;
    }

    const timer = setTimeout(() => {
      const seq = ++searchSeq.current;
      setSearching(true);
      searchGuests(trimmed)
        .then((found) => {
          if (seq !== searchSeq.current) return;
          setResults(found);
        })
        .catch(() => {
          if (seq !== searchSeq.current) return;
          showToast("error", "Search failed — please try again");
        })
        .finally(() => {
          if (seq === searchSeq.current) setSearching(false);
        });

      if (trimmed !== lastUrlQuery.current) {
        lastUrlQuery.current = trimmed;
        router.replace(`/invitation?q=${encodeURIComponent(trimmed)}`, {
          scroll: false,
        });
      }
    }, 350);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, familyParam]);

  useEffect(() => {
    if (!familyParam) {
      setInvitation(null);
      setFamilyNotFound(false);
      return;
    }
    const familyId = parseInt(familyParam, 10);
    if (isNaN(familyId)) {
      setFamilyNotFound(true);
      return;
    }
    let cancelled = false;
    setLoadingFamily(true);
    setFamilyNotFound(false);
    getFamilyInvitationByFamilyId(familyId)
      .then((data) => {
        if (cancelled) return;
        setInvitation(data);
        setFamilyNotFound(data === null);
      })
      .catch(() => {
        if (!cancelled) setFamilyNotFound(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingFamily(false);
      });
    return () => {
      cancelled = true;
    };
  }, [familyParam]);

  const backToSearchHref = queryParam
    ? `/invitation?q=${encodeURIComponent(queryParam)}`
    : "/invitation";

  function handleSelectGuest(hit: GuestSearchHit) {
    if (hit.familyId === null) return;
    const q = query.trim();
    router.push(
      `/invitation?family=${hit.familyId}${q ? `&q=${encodeURIComponent(q)}` : ""}`
    );
  }

  function applyStatus(rsvpIds: number[], status: RsvpStatus) {
    setInvitation((prev) =>
      prev
        ? {
            ...prev,
            rsvps: prev.rsvps.map((r) =>
              rsvpIds.includes(r.rsvpId) ? { ...r, status } : r
            ),
          }
        : prev
    );
  }

  function markPending(rsvpIds: number[], pending: boolean) {
    setPendingIds((prev) => {
      const next = new Set(prev);
      for (const id of rsvpIds) {
        if (pending) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }

  async function handleUpdateRsvp(rsvpId: number, status: RsvpStatus) {
    if (!invitation) return;
    const previous = invitation.rsvps.find((r) => r.rsvpId === rsvpId);
    if (!previous || previous.status === status) return;

    // Optimistic: flip the pill immediately, revert if the save fails.
    applyStatus([rsvpId], status);
    markPending([rsvpId], true);
    const result = await updateRsvpStatus(rsvpId, status);
    markPending([rsvpId], false);

    if (result.success) {
      showToast(
        "success",
        status === "ACCEPTED" ? "Saved — see you there!" : "Saved — we'll miss you"
      );
    } else {
      applyStatus([rsvpId], previous.status);
      showToast("error", "Couldn't save that — please try again");
    }
  }

  async function handleAcceptAll(rsvpIds: number[]) {
    if (!invitation || rsvpIds.length === 0) return;
    const previousById = new Map(
      invitation.rsvps
        .filter((r) => rsvpIds.includes(r.rsvpId))
        .map((r) => [r.rsvpId, r.status])
    );

    applyStatus(rsvpIds, "ACCEPTED");
    markPending(rsvpIds, true);
    const result = await updateRsvpStatusBulk(rsvpIds, "ACCEPTED");
    markPending(rsvpIds, false);

    if (result.success) {
      showToast("success", "Saved — the whole party is in!");
    } else {
      setInvitation((prev) =>
        prev
          ? {
              ...prev,
              rsvps: prev.rsvps.map((r) =>
                previousById.has(r.rsvpId)
                  ? { ...r, status: previousById.get(r.rsvpId)! }
                  : r
              ),
            }
          : prev
      );
      showToast("error", "Couldn't save that — please try again");
    }
  }

  const eventGroups = invitation
    ? invitation.rsvps.reduce(
        (acc, rsvp) => {
          if (!acc[rsvp.eventId]) {
            acc[rsvp.eventId] = {
              eventName: rsvp.eventName,
              eventDate: rsvp.eventDate,
              eventLocation: rsvp.eventLocation,
              eventDressCode: rsvp.eventDressCode,
              eventDetails: rsvp.eventDetails,
              rsvps: [],
            };
          }
          acc[rsvp.eventId].rsvps.push(rsvp);
          return acc;
        },
        {} as Record<number, EventGroup>
      )
    : {};

  const sortedGroups = Object.entries(eventGroups).sort(
    ([, a], [, b]) =>
      new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
  );

  const answered = invitation
    ? invitation.rsvps.filter((r) => r.status !== "PENDING").length
    : 0;
  const totalRsvps = invitation ? invitation.rsvps.length : 0;

  const inFamilyView = Boolean(familyParam);

  return (
    <div className="relative">
      <PageBackdrop />

      {/* Hero — -mt-24 cancels the layout's pt-24 so the content sits
          under the floating nav, matching the home page. */}
      <section
        className={`relative -mt-24 px-6 pt-32 sm:pt-36 ${
          inFamilyView ? "pb-10" : "pb-14"
        }`}
      >
        {!inFamilyView ? (
          <div className="relative max-w-2xl mx-auto text-center">
            <p className="text-xs tracking-[0.5em] uppercase text-text-secondary font-body mb-5 animate-fade-in">
              RSVP
            </p>
            <h1 className="font-display display-wonk text-4xl sm:text-6xl md:text-7xl font-light text-foreground leading-tight animate-fade-up delay-100">
              Find your{" "}
              <span className="italic text-rose font-normal">invitation</span>
            </h1>
            <p className="mt-6 text-sm md:text-base text-text-secondary leading-relaxed font-body max-w-md mx-auto animate-fade-up delay-300">
              Search your name to see your events and reply for everyone on
              your invitation.
            </p>

            <div className="mt-10 animate-scale-in delay-400">
              {/* Gradient ring around the search pill; brightens on focus */}
              <div className="max-w-md mx-auto rounded-full p-[2px] bg-linear-to-r from-rose/45 via-bluebell/40 to-leaf/40 shadow-[0_20px_45px_-18px_rgba(90,80,90,0.5)] focus-within:from-rose/80 focus-within:via-bluebell/70 focus-within:to-leaf/70 focus-within:shadow-[0_20px_45px_-14px_rgba(194,100,127,0.45)] transition-all duration-300">
                <div className="relative rounded-full bg-warm-white">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-blush pointer-events-none">
                    <Search
                      className="w-4.5 h-4.5 text-rose"
                      strokeWidth={2}
                    />
                  </span>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Type your name…"
                    aria-label="Search for your name"
                    className="w-full rounded-full bg-transparent pl-16 pr-14 py-4.5 font-display text-xl text-foreground placeholder:text-muted focus:outline-none"
                  />
                  {searching && (
                    <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-rose/70 animate-spin" />
                  )}
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-text-secondary/80 font-body animate-fade-in delay-500">
              We&apos;ll search as you type — a first name is enough.
            </p>
          </div>
        ) : (
          <div className="relative max-w-3xl mx-auto text-center">
            <p className="text-xs tracking-[0.5em] uppercase text-text-secondary font-body mb-5 animate-fade-in">
              {invitation
                ? `You're invited · ${invitation.familySide === "BRIDE" ? "Sarrah's side" : "Murtaza's side"}`
                : "You're invited"}
            </p>
            <h1 className="font-display display-wonk text-4xl sm:text-5xl md:text-6xl font-light text-foreground leading-tight animate-fade-up delay-100">
              {invitation ? (
                <NameHeading
                  names={invitation.guests.map((g) => firstName(g.name))}
                />
              ) : (
                "Your invitation"
              )}
            </h1>
            {invitation && (
              <p className="mt-6 text-sm md:text-base text-text-secondary leading-relaxed font-body max-w-md mx-auto animate-fade-up delay-300">
                Reply below for each guest — every change saves instantly.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Search results */}
      {!inFamilyView && results !== null && (
        <section className="relative max-w-xl mx-auto px-6 pb-28 w-full">
          <div className={`transition-opacity ${searching ? "opacity-60" : ""}`}>
            {results.length === 0 ? (
              <div className="text-center rounded-3xl bg-warm-white/70 border border-white/70 shadow-[0_14px_30px_-18px_rgba(90,80,90,0.35)] px-8 py-10 animate-fade-up">
                <Sparkles
                  className="w-6 h-6 text-rose/60 mx-auto mb-4"
                  strokeWidth={1.5}
                />
                <p className="font-display text-2xl text-foreground mb-2">
                  We couldn&apos;t find that name
                </p>
                <p className="text-sm text-text-secondary font-body leading-relaxed max-w-sm mx-auto">
                  Try just a first name or a different spelling. Still no luck?
                  Reach out to us and we&apos;ll sort it out.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-[11px] tracking-[0.3em] uppercase text-text-secondary font-body mb-5">
                  Select your name
                </p>
                {results.map((hit, i) => {
                  const others = hit.party.filter((n) => n !== hit.name);
                  const clickable = hit.familyId !== null;
                  return (
                    <button
                      key={hit.id}
                      onClick={() => handleSelectGuest(hit)}
                      disabled={!clickable}
                      className="group w-full text-left rounded-3xl bg-warm-white/90 border border-white/70 shadow-[0_14px_30px_-18px_rgba(90,80,90,0.35)] px-5 py-4 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-rose/30 hover:shadow-[0_18px_36px_-16px_rgba(194,100,127,0.35)] cursor-pointer disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-default animate-fade-up"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      <span
                        aria-hidden
                        className={`flex items-center justify-center w-11 h-11 rounded-full font-display display-wonk italic text-xl shrink-0 border border-white/70 transition-transform duration-300 group-hover:-rotate-6 ${AVATAR_TINTS[i % AVATAR_TINTS.length]}`}
                      >
                        {hit.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="font-display text-2xl text-foreground group-hover:text-rose transition-colors">
                          {hit.name}
                        </span>
                        <p className="text-xs text-text-secondary font-body mt-0.5">
                          {!clickable
                            ? "We're still preparing this invitation — check back soon"
                            : others.length > 0
                              ? `Invitation for ${hit.party.length} — with ${formatNameList(others.map(firstName))}`
                              : "Individual invitation"}
                        </p>
                      </div>
                      {clickable && (
                        <ChevronRight
                          className="w-5 h-5 text-muted group-hover:text-rose group-hover:translate-x-0.5 transition-all shrink-0"
                          strokeWidth={1.5}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Invitation view */}
      {inFamilyView && (
        <section className="max-w-2xl mx-auto px-6 pb-28 w-full">
          {loadingFamily && (
            <div className="text-center py-16">
              <div className="w-7 h-7 border-2 border-rose/30 border-t-rose rounded-full animate-spin mx-auto" />
              <p className="text-xs tracking-[0.2em] uppercase text-text-secondary font-body mt-5">
                Opening your invitation…
              </p>
            </div>
          )}

          {!loadingFamily && familyNotFound && (
            <div className="text-center rounded-3xl bg-warm-white/70 border border-white/70 shadow-[0_14px_30px_-18px_rgba(90,80,90,0.35)] px-8 py-10 animate-fade-up">
              <p className="font-display text-2xl text-foreground mb-2">
                We couldn&apos;t find that invitation
              </p>
              <p className="text-sm text-text-secondary font-body leading-relaxed max-w-sm mx-auto mb-6">
                The link may be out of date — try searching for your name
                instead.
              </p>
              <Link
                href={backToSearchHref}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-deepblue text-warm-white text-[10px] tracking-[0.25em] uppercase font-body hover:bg-rose transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
                Back to search
              </Link>
            </div>
          )}

          {!loadingFamily && invitation && (
            <div className="space-y-7">
              <div className="animate-fade-up delay-400">
                <RsvpProgress answered={answered} total={totalRsvps} />
              </div>

              <div className="space-y-8 pt-2">
                {sortedGroups.map(([eventId, group], i) => (
                  <div
                    key={eventId}
                    className="animate-fade-up"
                    style={{ animationDelay: `${500 + i * 100}ms` }}
                  >
                    <EventCard
                      group={group}
                      index={i}
                      pendingIds={pendingIds}
                      onUpdateRsvp={handleUpdateRsvp}
                      onAcceptAll={handleAcceptAll}
                    />
                  </div>
                ))}
              </div>

              <div
                className="animate-fade-up"
                style={{ animationDelay: `${500 + sortedGroups.length * 100}ms` }}
              >
                <EmailCard
                  familyId={invitation.familyId}
                  onSuccess={(msg) => showToast("success", msg)}
                />
              </div>

              <div className="text-center pt-4">
                <Link
                  href={backToSearchHref}
                  className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-text-secondary hover:text-rose transition-colors font-body"
                >
                  <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} />
                  Search for another guest
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Floating save toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-up"
        >
          <span
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] tracking-[0.2em] uppercase font-body text-warm-white shadow-[0_14px_36px_-14px_rgba(90,80,90,0.6)] ${
              toast.kind === "success" ? "bg-leaf" : "bg-rose"
            }`}
          >
            {toast.kind === "success" && (
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
            )}
            {toast.text}
          </span>
        </div>
      )}
    </div>
  );
}
