import type { Metadata } from "next";
import { Suspense } from "react";
import { InvitationClient } from "./InvitationClient";

export const metadata: Metadata = {
  title: "Find Your Invitation — Murtaza & Sarrah",
  description: "Look up your name to view and manage your RSVP.",
};

export default function InvitationPage() {
  return (
    <div className="min-h-screen">
      <Suspense>
        <InvitationClient />
      </Suspense>
    </div>
  );
}
