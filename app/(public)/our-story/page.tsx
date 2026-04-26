import type { Metadata } from "next";
import { OurStoryClient } from "./OurStoryClient";

export const metadata: Metadata = {
  title: "Our Story — Murtaza & Sarrah",
  description: "How we met, how we grew, and how we're beginning forever.",
};

export default function OurStoryPage() {
  return <OurStoryClient />;
}
