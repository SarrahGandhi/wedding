import Link from "next/link";
import { Countdown } from "../components/Countdown";

const DAYS = [
  {
    numeral: "1",
    name: "Henna, Colour & Music",
    date: "Tue, October 20",
    blurb: "We begin with colour, music, mehndi, and the kind of joy that gets everyone moving.",
    note: "Celebrations begin",
    card: "from-warm-white via-blush/55 to-peach/55",
    numeralColor: "text-rose",
    dateColor: "text-tangerine",
    tilt: "md:-rotate-[3deg]",
  },
  {
    numeral: "2",
    name: "A Farmhouse Evening",
    date: "Wed, October 21",
    blurb: "A softer night in the open air, with golden light, family, and a few quiet promises.",
    note: "Open air & family",
    card: "from-warm-white via-powder to-sky/55",
    numeralColor: "text-deepblue",
    dateColor: "text-bluebell",
    tilt: "md:rotate-[1.5deg]",
  },
  {
    numeral: "3",
    name: "The Main Celebration",
    date: "Thu, October 22",
    blurb: "The ceremony, blessings, dinner, and one very full dance floor to carry us into forever.",
    note: "The big one",
    card: "from-warm-white via-peach/45 to-blush/60",
    numeralColor: "text-tangerine",
    dateColor: "text-deepblue",
    tilt: "md:rotate-[3deg]",
  },
];

const HERO_FLECKS = [
  { top: "18%", left: "9%", color: "bg-tangerine/25", delay: "0s", size: "h-1.5 w-1.5" },
  { top: "24%", left: "86%", color: "bg-rose/20", delay: "-2s", size: "h-2 w-2" },
  { top: "58%", left: "6%", color: "bg-leaf/20", delay: "-5s", size: "h-1.5 w-1.5" },
  { top: "70%", left: "92%", color: "bg-tangerine/20", delay: "-3s", size: "h-2 w-2" },
  { top: "84%", left: "18%", color: "bg-deepblue/20", delay: "-7s", size: "h-1 w-1" },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <section className="grain relative -mt-24 min-h-screen overflow-hidden px-5 pb-20 pt-32 sm:px-6 lg:pt-28">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -left-32 w-[32rem] h-[32rem] rounded-full bg-peach opacity-[0.22] blur-3xl animate-drift" />
          <div
            className="absolute top-10 -right-44 w-[34rem] h-[34rem] rounded-full bg-blush opacity-20 blur-3xl animate-drift"
            style={{ animationDelay: "-6s" }}
          />
          <div
            className="absolute bottom-0 left-[26%] w-[26rem] h-[26rem] rounded-full bg-sky opacity-[0.18] blur-3xl animate-drift"
            style={{ animationDelay: "-11s" }}
          />
          {HERO_FLECKS.map((dot, i) => (
            <span
              key={i}
              className={`absolute hidden rounded-full sm:block ${dot.color} ${dot.size} animate-bob`}
              style={{ top: dot.top, left: dot.left, animationDelay: dot.delay }}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="max-w-xl animate-fade-up delay-200">
            <p className="mb-6 text-[11px] uppercase tracking-[0.55em] text-text-secondary font-body">
              The wedding of
            </p>
            <h1 className="font-display display-wonk text-[3.75rem] font-light leading-[0.92] text-foreground sm:text-7xl lg:text-[6.25rem]">
              <span className="block">Murtaza</span>
              <span className="my-1 block font-display text-3xl leading-none text-rose sm:text-4xl lg:text-5xl">
                &
              </span>
              <span className="block">Sarrah</span>
            </h1>
            <p className="mt-8 font-display text-3xl italic leading-snug text-bluebell sm:text-4xl">
              October 20-22, 2026
            </p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-text-secondary font-body sm:text-base">
              A three-day wedding weekend with colour, family, food, and the people who made our story feel like home.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/invitation"
                className="inline-block rounded-full bg-deepblue px-10 py-4 text-center text-xs uppercase tracking-[0.3em] text-warm-white shadow-[0_14px_30px_-12px_var(--bluebell)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose"
              >
                Find Your Invitation
              </Link>
              <Link
                href="/our-story"
                className="inline-flex items-center justify-center rounded-full border-2 border-deepblue/20 px-8 py-3.5 text-xs uppercase tracking-[0.3em] text-deepblue transition-colors duration-300 hover:bg-deepblue hover:text-warm-white font-body"
              >
                Read Our Story
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg animate-scale-in delay-400">
            <span
              aria-hidden
              className="absolute -left-5 top-8 h-full w-full -rotate-6 rounded-[2rem] border border-white/60 bg-peach/55 shadow-[0_18px_44px_-28px_rgba(90,80,90,0.45)]"
            />
            <span
              aria-hidden
              className="absolute -right-5 top-4 h-full w-full rotate-3 rounded-[2rem] border border-white/60 bg-blush/45 shadow-[0_18px_44px_-28px_rgba(90,80,90,0.45)]"
            />
            <article className="relative overflow-hidden rounded-[2.25rem] border border-white/70 bg-warm-white/90 p-7 shadow-[0_24px_70px_-28px_rgba(90,80,90,0.45)] backdrop-blur-xl sm:p-9 md:rotate-1">
              <span
                aria-hidden
                className="absolute inset-4 rounded-[1.75rem] border border-dashed border-rose/20"
              />
              <div className="relative">
                <p className="text-[11px] uppercase tracking-[0.4em] text-text-secondary font-body">
                  Countdown
                </p>
                <h2 className="mt-3 font-display display-wonk text-4xl font-light leading-none text-foreground sm:text-5xl">
                  Until the big day
                </h2>
              </div>

              <div className="relative mt-9 rounded-[1.75rem] border border-white/75 bg-linear-to-br from-powder via-warm-white to-peach/45 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_16px_34px_-26px_rgba(90,80,90,0.45)] sm:p-5">
                <span
                  aria-hidden
                  className="absolute left-5 right-5 top-4 border-t border-dashed border-white/80"
                />
                <div className="relative pt-5">
                  <Countdown />
                </div>
              </div>

              <div className="relative mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-peach/70 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-tangerine font-body">
                  Oct 22, 2026
                </span>
                <span className="rounded-full bg-powder px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-deepblue font-body">
                  Three days / one big yes
                </span>
              </div>
              <p className="relative mt-6 max-w-sm text-sm leading-relaxed text-text-secondary font-body">
                Counting down to vows, dinner, dancing, and the main celebration.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-5 pb-28 pt-8 sm:px-6">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-[-10rem] top-28 h-72 w-72 rounded-full bg-blush opacity-35 blur-3xl animate-drift" />
          <div
            className="absolute bottom-10 right-[-8rem] h-80 w-80 rounded-full bg-peach opacity-30 blur-3xl animate-drift"
            style={{ animationDelay: "-8s" }}
          />
        </div>
        <div className="mx-auto max-w-6xl">
          <div aria-hidden className="mb-16 flex justify-center gap-3">
            {["bg-rose/45", "bg-deepblue/35", "bg-rose/45"].map(
              (c, i) => (
                <span key={i} className={`h-1.5 w-12 rounded-full ${c}`} />
              ),
            )}
          </div>

          <div className="relative">
            <span
              aria-hidden
              className="absolute -right-6 -top-14 hidden font-display display-wonk italic text-[12rem] leading-none text-rose opacity-10 sm:block"
            >
              3
            </span>
            <div className="relative max-w-3xl">
              <p className="mb-4 text-xs uppercase tracking-[0.5em] text-text-secondary font-body">
                The wedding programme
              </p>
              <h2 className="font-display display-wonk text-5xl font-light leading-tight text-foreground sm:text-6xl lg:text-7xl">
                Three days, <span className="italic text-rose">one</span> big
                celebration.
              </h2>
              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-text-secondary font-body sm:text-base">
                Each day has its own colour, pace, and a little bit of magic.
                More details are coming soon, but here&apos;s the shape of the
                celebration we&apos;re dreaming up.
              </p>
            </div>

            <div className="relative mt-12">
              <span
                aria-hidden
                className="absolute left-8 right-8 top-8 hidden border-t border-dashed border-rose/30 md:block"
              />
              <div className="flex snap-x gap-5 overflow-x-auto pb-6 md:grid md:grid-cols-3 md:overflow-visible md:pb-0 lg:gap-7">
                {DAYS.map((day) => (
                  <article
                    key={day.numeral}
                    className={`group relative min-w-[18rem] snap-start overflow-hidden rounded-[2rem] border border-white/65 bg-linear-to-br ${day.card} ${day.tilt} p-6 shadow-[0_18px_40px_-20px_rgba(90,80,90,0.35)] transition-transform duration-300 hover:-translate-y-1.5 md:min-w-0 md:hover:rotate-0 sm:p-8`}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-x-7 top-5 border-t border-dashed border-white/85"
                    />
                    <span
                      className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-warm-white font-display display-wonk text-3xl italic ${day.numeralColor} shadow-[0_14px_30px_-18px_rgba(90,80,90,0.5)]`}
                    >
                      {day.numeral}
                    </span>
                    <div
                      aria-hidden
                      className={`mt-8 h-2 w-20 rounded-full ${day.numeralColor} opacity-45 transition-transform duration-300 group-hover:scale-x-110`}
                    />
                    <div className="relative mt-8 flex flex-wrap items-center gap-3">
                      <p
                        className={`text-[11px] uppercase tracking-[0.3em] ${day.dateColor} font-body`}
                      >
                        {day.date}
                      </p>
                      <span className="rounded-full bg-warm-white/70 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-text-secondary font-body">
                        {day.note}
                      </span>
                    </div>
                    <h3 className="relative mt-4 font-display text-3xl leading-snug text-foreground sm:text-4xl">
                      {day.name}
                    </h3>
                    <p className="relative mt-4 text-sm leading-relaxed text-text-secondary font-body">
                      {day.blurb}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-24 text-center">
            <p className="mb-6 font-display text-2xl italic text-text-secondary">
              We can&apos;t wait to celebrate with you.
            </p>
            <Link
              href="/invitation"
              className="inline-block rounded-full border-2 border-deepblue/30 px-8 py-3.5 text-xs uppercase tracking-[0.3em] text-deepblue transition-colors duration-300 hover:bg-deepblue hover:text-warm-white font-body"
            >
              RSVP — Find Your Invitation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

