import Link from "next/link";
import { Countdown } from "../components/Countdown";

const DAYS = [
  {
    numeral: "1",
    name: "The Celebrations Begin",
    date: "Tuesday, October 20",
    blurb: "We kick things off — bring your colour and your dancing shoes.",
    card: "from-blush to-mint",
    numeralColor: "text-rose",
    dateColor: "text-leaf",
    tilt: "md:-rotate-2",
    icon: <FlowerIcon className="text-rose/70" />,
  },
  {
    numeral: "2",
    name: "The Farmhouse",
    date: "Wednesday, October 21",
    blurb: "A day in the open air — golden light, blue skies, good company.",
    card: "from-sky to-peach",
    numeralColor: "text-bluebell",
    dateColor: "text-tangerine",
    tilt: "md:rotate-1",
    icon: <SunIcon className="text-tangerine/70" />,
  },
  {
    numeral: "3",
    name: "The Main Event",
    date: "Thursday, October 22",
    blurb: "The big one. We say our vows, and the celebration peaks.",
    card: "from-warm-white to-powder",
    numeralColor: "text-deepblue",
    dateColor: "text-deepblue",
    tilt: "md:-rotate-1",
    icon: <RingsIcon className="text-deepblue/60" />,
  },
];

const CONFETTI = [
  { top: "18%", left: "12%", color: "bg-rose/50", delay: "0s", size: "w-2 h-2" },
  { top: "30%", left: "85%", color: "bg-bluebell/40", delay: "-2s", size: "w-3 h-3" },
  { top: "62%", left: "8%", color: "bg-tangerine/40", delay: "-4s", size: "w-2.5 h-2.5" },
  { top: "74%", left: "90%", color: "bg-leaf/40", delay: "-1s", size: "w-2 h-2" },
  { top: "12%", left: "70%", color: "bg-rose/35", delay: "-5s", size: "w-2 h-2" },
  { top: "82%", left: "30%", color: "bg-bluebell/35", delay: "-3s", size: "w-2.5 h-2.5" },
];

export default function Home() {
  return (
    <div className="relative">
      {/* Hero */}
      {/* -mt-24 cancels the layout's pt-24 so the pastel backdrop runs
          underneath the floating nav to the top of the viewport */}
      <section className="grain relative -mt-24 flex flex-col items-center justify-center min-h-screen px-6 pt-28 pb-20 overflow-hidden">
        {/* Soft pastel atmosphere */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-blush opacity-80 blur-3xl animate-drift" />
          <div
            className="absolute top-1/4 -right-40 w-[34rem] h-[34rem] rounded-full bg-sky opacity-80 blur-3xl animate-drift"
            style={{ animationDelay: "-6s" }}
          />
          <div
            className="absolute -bottom-36 left-1/5 w-[28rem] h-[28rem] rounded-full bg-peach opacity-70 blur-3xl animate-drift"
            style={{ animationDelay: "-11s" }}
          />
          <div
            className="absolute bottom-12 right-1/4 w-80 h-80 rounded-full bg-mint opacity-70 blur-3xl animate-drift"
            style={{ animationDelay: "-3s" }}
          />
          {CONFETTI.map((dot, i) => (
            <span
              key={i}
              className={`absolute rounded-full ${dot.color} ${dot.size} animate-bob hidden sm:block`}
              style={{ top: dot.top, left: dot.left, animationDelay: dot.delay }}
            />
          ))}
        </div>

        {/* Names */}
        <div className="relative text-center animate-fade-up delay-200">
          <p className="text-xs tracking-[0.5em] uppercase text-text-secondary font-body mb-5">
            The wedding of
          </p>
          <h1 className="font-display display-wonk text-5xl sm:text-7xl md:text-8xl font-light text-foreground leading-tight sm:leading-none">
            Murtaza{" "}
            <span className="text-rose italic font-normal">&</span>{" "}
            Sarrah
          </h1>
        </div>

        {/* Date line */}
        <div className="relative text-center mt-8 mb-12 animate-fade-up delay-400">
          <p className="text-sm tracking-[0.3em] uppercase text-text-secondary font-body">
            Three days of celebration
          </p>
          <p className="font-display italic text-2xl sm:text-3xl text-bluebell mt-2">
            October 20 – 22, 2026
          </p>
        </div>

        {/* Countdown */}
        <div className="relative animate-scale-in delay-500">
          <Countdown />
        </div>

        {/* CTA */}
        <div className="relative mt-14 flex flex-col items-center gap-5 animate-fade-up delay-700">
          <Link
            href="/invitation"
            className="inline-block px-10 py-4 rounded-full bg-deepblue text-warm-white text-xs tracking-[0.3em] uppercase font-body shadow-[0_14px_30px_-12px_var(--bluebell)] hover:bg-rose hover:-translate-y-0.5 transition-all duration-300 text-center"
          >
            Find Your Invitation
          </Link>
          <Link
            href="/our-story"
            className="text-xs tracking-[0.3em] uppercase text-text-secondary hover:text-rose transition-colors font-body"
          >
            Read Our Story
          </Link>
        </div>
      </section>

      {/* Three days */}
      <section className="relative px-6 pb-28 pt-4">
        <div className="max-w-5xl mx-auto">
          {/* Playful dotted divider */}
          <div aria-hidden className="flex justify-center gap-2.5 mb-14">
            {["bg-rose/60", "bg-leaf/60", "bg-bluebell/60", "bg-tangerine/60", "bg-deepblue/50"].map(
              (c, i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${c}`} />
              ),
            )}
          </div>

          <div className="text-center mb-14">
            <p className="text-xs tracking-[0.5em] uppercase text-text-secondary font-body mb-4">
              Save the dates
            </p>
            <h2 className="font-display display-wonk text-4xl sm:text-5xl font-light text-foreground">
              One wedding,{" "}
              <span className="italic text-rose">three</span> days
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6">
            {DAYS.map((day) => (
              <article
                key={day.numeral}
                className={`group relative rounded-3xl bg-linear-to-br ${day.card} ${day.tilt} p-8 pt-12 shadow-[0_18px_40px_-20px_rgba(90,80,90,0.35)] border border-white/60 transition-transform duration-300 md:hover:rotate-0 hover:-translate-y-1.5`}
              >
                <span
                  aria-hidden
                  className={`absolute -top-6 left-6 font-display display-wonk italic text-7xl ${day.numeralColor} drop-shadow-[0_2px_0_rgba(255,255,255,0.8)]`}
                >
                  {day.numeral}
                </span>
                <div className="absolute top-6 right-6 w-10 h-10 transition-transform duration-500 group-hover:rotate-12">
                  {day.icon}
                </div>
                <p
                  className={`text-[11px] tracking-[0.3em] uppercase font-body ${day.dateColor} mt-6 mb-3`}
                >
                  {day.date}
                </p>
                <h3 className="font-display text-3xl text-foreground leading-snug mb-3">
                  {day.name}
                </h3>
                <p className="text-sm text-text-secondary font-body leading-relaxed">
                  {day.blurb}
                </p>
              </article>
            ))}
          </div>

          <div className="text-center mt-20">
            <p className="font-display italic text-xl text-text-secondary mb-6">
              We can&apos;t wait to celebrate with you.
            </p>
            <Link
              href="/invitation"
              className="inline-block px-8 py-3.5 rounded-full border-2 border-deepblue/30 text-deepblue text-xs tracking-[0.3em] uppercase font-body hover:bg-deepblue hover:text-warm-white transition-colors duration-300"
            >
              RSVP — Find Your Invitation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FlowerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <circle cx="24" cy="24" r="4" fill="currentColor" stroke="none" />
      <ellipse cx="24" cy="12.5" rx="5" ry="7" />
      <ellipse cx="24" cy="35.5" rx="5" ry="7" />
      <ellipse cx="12.5" cy="24" rx="7" ry="5" />
      <ellipse cx="35.5" cy="24" rx="7" ry="5" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
    >
      <circle cx="24" cy="24" r="8" />
      <path d="M24 5.5v5M24 37.5v5M5.5 24h5M37.5 24h5M10.5 10.5l3.5 3.5M34 34l3.5 3.5M37.5 10.5L34 14M14 34l-3.5 3.5" />
    </svg>
  );
}

function RingsIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className={className}
    >
      <circle cx="19" cy="28" r="9.5" />
      <circle cx="29" cy="28" r="9.5" />
      <path d="M24 6.5l-3.5 4.5h7z" />
    </svg>
  );
}
