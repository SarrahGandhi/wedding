import type { Metadata } from "next";
import { Suspense } from "react";
import { InvitationClient } from "./InvitationClient";

export const metadata: Metadata = {
  title: "You're Invited — Murtaza & Sarrah",
  description: "Find your invitation and RSVP to celebrate with us.",
  openGraph: {
    title: "You're Invited — Murtaza & Sarrah",
    description: "Find your invitation and RSVP to celebrate with us.",
    siteName: "Murtaza & Sarrah",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "You're Invited — Murtaza & Sarrah",
    description: "Find your invitation and RSVP to celebrate with us.",
  },
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
