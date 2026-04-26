import Link from "next/link";
import { Countdown } from "../components/Countdown";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6">
      {/* Decorative top element */}
      <div className="animate-fade-in delay-100">
        <div className="w-px h-16 bg-linear-to-b from-transparent via-accent/40 to-accent/20 mx-auto" />
      </div>

      {/* Names */}
      <div className="text-center mt-8 animate-fade-up delay-200">
        <p className="text-xs tracking-[0.5em] uppercase text-text-secondary font-body mb-4">
          The wedding of
        </p>
        <h1 className="font-display text-4xl sm:text-6xl md:text-7xl font-light tracking-wide text-foreground leading-tight sm:leading-none">
          Murtaza <span className="text-accent font-light italic">&</span>{" "}
          Sarrah
        </h1>
      </div>

      {/* Decorative divider */}
      <div className="my-10 animate-draw-line delay-300">
        <div className="w-40 h-px bg-linear-to-r from-transparent via-accent/50 to-transparent" />
      </div>

      {/* Date & venue */}
      <div className="text-center animate-fade-up delay-400 mb-12">
        <p className="text-sm tracking-[0.3em] uppercase text-text-secondary font-body">
          October Twenty Second, Two Thousand Twenty Six
        </p>
      </div>

      {/* Countdown */}
      <div className="animate-scale-in delay-500">
        <Countdown />
      </div>

      {/* CTA */}
      <div className="mt-16 flex flex-col items-center gap-4 animate-fade-up delay-700">
        <Link
          href="/invitation"
          className="inline-block px-10 py-3.5 bg-foreground text-background text-xs tracking-[0.3em] uppercase font-body hover:bg-accent transition-colors duration-300 text-center"
        >
          Find Your Invitation
        </Link>
        <Link
          href="/our-story"
          className="text-xs tracking-[0.3em] uppercase text-text-secondary hover:text-accent transition-colors font-body"
        >
          Read Our Story
        </Link>
      </div>

      {/* Decorative bottom element */}
      <div className="mt-16 animate-fade-in delay-800">
        <div className="w-px h-16 bg-linear-to-t from-transparent via-accent/40 to-accent/20 mx-auto" />
      </div>
    </div>
  );
}
