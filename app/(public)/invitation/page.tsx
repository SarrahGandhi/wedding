import type { Metadata } from "next";
import { InvitationClient } from "./InvitationClient";

export const metadata: Metadata = {
  title: "Find Your Invitation — Murtaza & Sarrah",
  description: "Look up your name to view and manage your RSVP.",
};

export default function InvitationPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center py-24 md:py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-cream/50 via-background to-background" />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <p className="text-xs tracking-[0.5em] uppercase text-accent font-body mb-6 animate-fade-in">
            You&apos;re invited
          </p>
          <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-light text-foreground animate-fade-up delay-100 leading-tight md:leading-none">
            Find Your Invitation
          </h1>
          <div className="mt-6 w-24 h-px bg-accent/40 mx-auto animate-draw-line delay-300" />
          <p className="mt-6 text-sm md:text-base text-text-secondary leading-relaxed font-body animate-fade-up delay-400">
            Search for your name below to view your events and manage RSVP
            responses for yourself and your family.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 pb-32">
        <InvitationClient />
      </section>
    </div>
  );
}
