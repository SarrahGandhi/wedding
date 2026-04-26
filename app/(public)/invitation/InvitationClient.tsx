"use client";

import { useState, useTransition } from "react";
import { Mail, Check, ChevronRight } from "lucide-react";
import {
  searchGuests,
  getFamilyInvitation,
  updateRsvpStatus,
  addFamilyEmail,
  type GuestResult,
  type FamilyInvitation,
  type EventRsvp,
} from "./actions";

type RsvpStatus = "PENDING" | "ACCEPTED" | "DECLINED";

function StatusBadge({ status }: { status: RsvpStatus }) {
  const styles: Record<RsvpStatus, string> = {
    PENDING: "bg-cream-dark text-text-secondary",
    ACCEPTED: "bg-sage/10 text-sage",
    DECLINED: "bg-red-50 text-red-400",
  };
  const labels: Record<RsvpStatus, string> = {
    PENDING: "Pending",
    ACCEPTED: "Attending",
    DECLINED: "Declined",
  };
  return (
    <span
      className={`text-[10px] tracking-[0.2em] uppercase px-3 py-1 rounded-full font-body ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function RsvpButton({
  label,
  isActive,
  onClick,
  variant,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  variant: "accept" | "decline";
}) {
  const baseActive =
    variant === "accept"
      ? "bg-sage text-white border-sage"
      : "bg-foreground/80 text-white border-foreground/80";
  const baseInactive =
    variant === "accept"
      ? "border-sage/30 text-sage hover:bg-sage/5"
      : "border-foreground/20 text-text-secondary hover:bg-foreground/5";

  return (
    <button
      onClick={onClick}
      className={`text-[10px] tracking-[0.2em] uppercase px-4 py-2 border rounded transition-all duration-200 font-body cursor-pointer ${
        isActive ? baseActive : baseInactive
      }`}
    >
      {label}
    </button>
  );
}

function EmailSection({
  familyId,
  onSuccess,
}: {
  familyId: number;
  onSuccess: (msg: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [addedEmails, setAddedEmails] = useState<string[]>([]);
  const [adding, startAdding] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setError(null);
    startAdding(async () => {
      const result = await addFamilyEmail(familyId, trimmed);
      if (result.success) {
        setAddedEmails((prev) =>
          prev.includes(trimmed) ? prev : [...prev, trimmed]
        );
        setEmail("");
        onSuccess("Email added successfully");
      } else {
        setError(result.error ?? "Failed to add email");
      }
    });
  }

  return (
    <div className="border border-border/60 bg-warm-white p-6 md:p-8">
      <div className="flex items-center gap-3 mb-1">
        <Mail className="w-4 h-4 text-accent" strokeWidth={1.5} />
        <h3 className="font-display text-2xl md:text-3xl font-light text-foreground">
          Stay Informed
        </h3>
      </div>
      <p className="text-sm text-text-secondary font-body leading-relaxed mb-6">
        Add your email to receive updates and details about the events.
        You can add multiple email addresses for your family.
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
          className="flex-1 bg-background border border-border/60 px-4 py-3 text-sm font-body text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !email.trim()}
          className="px-5 py-3 bg-foreground text-background text-[10px] tracking-[0.25em] uppercase font-body hover:bg-accent transition-colors disabled:opacity-40 cursor-pointer shrink-0"
        >
          {adding ? "..." : "Add"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 font-body mt-2">{error}</p>
      )}

      {addedEmails.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {addedEmails.map((addr) => (
            <span
              key={addr}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sage/10 text-sage text-xs font-body rounded-full"
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

function EventCard({
  eventName,
  eventDate,
  eventLocation,
  eventDressCode,
  eventDetails,
  guestRsvps,
  onUpdateRsvp,
}: {
  eventName: string;
  eventDate: string;
  eventLocation: string | null;
  eventDressCode: string | null;
  eventDetails: string | null;
  guestRsvps: EventRsvp[];
  onUpdateRsvp: (rsvpId: number, status: RsvpStatus) => void;
}) {
  const formattedDate = new Date(eventDate + "T00:00:00").toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" }
  );

  return (
    <div className="border border-border/60 bg-warm-white p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
        <div>
          <h3 className="font-display text-2xl md:text-3xl font-light text-foreground">
            {eventName}
          </h3>
          <p className="text-xs tracking-[0.2em] uppercase text-accent font-body mt-1">
            {formattedDate}
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-1 text-xs text-text-secondary font-body">
          {eventLocation && <span>{eventLocation}</span>}
          {eventDressCode && (
            <span className="italic">Dress code: {eventDressCode}</span>
          )}
        </div>
      </div>

      {eventDetails && (
        <p className="text-sm text-text-secondary font-body leading-relaxed mb-6 border-l-2 border-accent/20 pl-4">
          {eventDetails}
        </p>
      )}

      <div className="space-y-3">
        {guestRsvps.map((rsvp) => (
          <div
            key={rsvp.rsvpId}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-t border-border/30"
          >
            <div className="flex items-center gap-3">
              <span className="font-display text-lg text-foreground">
                {rsvp.guestName}
              </span>
              <StatusBadge status={rsvp.status} />
            </div>
            <div className="flex items-center gap-2">
              <RsvpButton
                label="Attending"
                isActive={rsvp.status === "ACCEPTED"}
                variant="accept"
                onClick={() => onUpdateRsvp(rsvp.rsvpId, "ACCEPTED")}
              />
              <RsvpButton
                label="Decline"
                isActive={rsvp.status === "DECLINED"}
                variant="decline"
                onClick={() => onUpdateRsvp(rsvp.rsvpId, "DECLINED")}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InvitationClient() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GuestResult[] | null>(null);
  const [invitation, setInvitation] = useState<FamilyInvitation | null>(null);
  const [searching, startSearching] = useTransition();
  const [loading, startLoading] = useTransition();
  const [updating, startUpdating] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function handleSearch() {
    if (query.trim().length < 2) return;
    setInvitation(null);
    setResults(null);
    startSearching(async () => {
      const found = await searchGuests(query);
      setResults(found);
    });
  }

  function handleSelectGuest(guestId: number) {
    startLoading(async () => {
      const data = await getFamilyInvitation(guestId);
      setInvitation(data);
      setResults(null);
    });
  }

  function handleUpdateRsvp(rsvpId: number, status: RsvpStatus) {
    setSuccessMessage(null);
    startUpdating(async () => {
      const result = await updateRsvpStatus(rsvpId, status);
      if (result.success && invitation) {
        setInvitation({
          ...invitation,
          rsvps: invitation.rsvps.map((r) =>
            r.rsvpId === rsvpId ? { ...r, status } : r
          ),
        });
        setSuccessMessage("RSVP updated successfully");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    });
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
        {} as Record<
          number,
          {
            eventName: string;
            eventDate: string;
            eventLocation: string | null;
            eventDressCode: string | null;
            eventDetails: string | null;
            rsvps: EventRsvp[];
          }
        >
      )
    : {};

  return (
    <div className="w-full">
      {/* Search */}
      <div className="max-w-md mx-auto mb-16">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter your name..."
            className="w-full bg-warm-white border border-border/60 px-5 py-4 pr-28 font-display text-xl text-foreground placeholder:text-muted focus:outline-none focus:border-accent/50 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={searching || query.trim().length < 2}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-foreground text-background text-[10px] tracking-[0.25em] uppercase font-body hover:bg-accent transition-colors disabled:opacity-40 cursor-pointer"
          >
            {searching ? "..." : "Search"}
          </button>
        </div>
      </div>

      {/* Search results */}
      {results !== null && !invitation && (
        <div className="max-w-md mx-auto">
          {results.length === 0 ? (
            <p className="text-center text-text-secondary font-body text-sm">
              No guests found with that name. Please try again.
            </p>
          ) : (
            <div className="border border-border/60 bg-warm-white divide-y divide-border/30">
              <p className="px-5 py-3 text-xs tracking-[0.2em] uppercase text-text-secondary font-body">
                Select your name
              </p>
              {results.map((guest) => (
                <button
                  key={guest.id}
                  onClick={() => handleSelectGuest(guest.id)}
                  disabled={loading}
                  className="w-full text-left px-5 py-4 hover:bg-cream/50 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <span className="font-display text-lg text-foreground group-hover:text-accent transition-colors">
                    {guest.name}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" strokeWidth={1.5} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto" />
          <p className="text-xs tracking-[0.2em] uppercase text-text-secondary font-body mt-4">
            Loading invitation...
          </p>
        </div>
      )}

      {/* Invitation view */}
      {invitation && !loading && (
        <div className="max-w-2xl mx-auto">
          {/* Family header */}
          <div className="text-center mb-10">
            <p className="text-xs tracking-[0.4em] uppercase text-accent font-body mb-3">
              {invitation.familySide === "BRIDE"
                ? "Bride's Side"
                : "Groom's Side"}
            </p>
            <h2 className="font-display text-3xl md:text-4xl font-light text-foreground">
              {invitation.guests.map((g) => g.name).join(", ")}
            </h2>
            <div className="mt-4 w-16 h-px bg-accent/40 mx-auto" />
          </div>

          {/* Success toast */}
          {successMessage && (
            <div className="mb-6 text-center">
              <span className="inline-block px-4 py-2 bg-sage/10 text-sage text-xs tracking-[0.2em] uppercase font-body rounded-full">
                {successMessage}
              </span>
            </div>
          )}

          {/* Email section */}
          <div className="mb-6">
            <EmailSection
              familyId={invitation.familyId}
              onSuccess={(msg) => {
                setSuccessMessage(msg);
                setTimeout(() => setSuccessMessage(null), 3000);
              }}
            />
          </div>

          {/* Updating overlay */}
          <div className={`space-y-6 ${updating ? "opacity-70" : ""}`}>
            {Object.entries(eventGroups)
              .sort(
                ([, a], [, b]) =>
                  new Date(a.eventDate).getTime() -
                  new Date(b.eventDate).getTime()
              )
              .map(([eventId, group]) => (
                <EventCard
                  key={eventId}
                  eventName={group.eventName}
                  eventDate={group.eventDate}
                  eventLocation={group.eventLocation}
                  eventDressCode={group.eventDressCode}
                  eventDetails={group.eventDetails}
                  guestRsvps={group.rsvps}
                  onUpdateRsvp={handleUpdateRsvp}
                />
              ))}
          </div>

          {/* Back button */}
          <div className="mt-10 text-center">
            <button
              onClick={() => {
                setInvitation(null);
                setResults(null);
                setQuery("");
              }}
              className="text-xs tracking-[0.2em] uppercase text-text-secondary hover:text-accent transition-colors font-body cursor-pointer"
            >
              &larr; Search for another guest
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
