import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Countdown } from "../components/Countdown";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative -mt-24 min-h-[100dvh] overflow-hidden px-5 pb-20 pt-32 sm:px-6 lg:pt-28">
        <div className="relative z-10 mx-auto grid min-h-[calc(100dvh-8rem)] w-full max-w-6xl items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="max-w-xl animate-fade-up delay-200">
            <h1 className="font-display display-wonk text-[3.75rem] font-light leading-[0.92] text-foreground sm:text-7xl lg:text-[6.25rem]">
              <span className="block">Murtaza</span>
              <span className="my-2 block font-accent text-3xl italic leading-none text-rose sm:text-4xl lg:text-5xl">
                &
              </span>
              <span className="block">Sarrah</span>
            </h1>
            <p className="mt-8 max-w-md text-sm leading-relaxed text-text-secondary font-body sm:text-base">
              We can’t wait to celebrate with the people who made our story feel like home.
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/invitation"
                className="group inline-flex items-center justify-center gap-4 rounded-full bg-deepblue py-2 pl-8 pr-2 text-center text-xs uppercase tracking-[0.28em] text-warm-white shadow-[0_14px_30px_-12px_var(--bluebell)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 hover:bg-rose active:scale-[0.98]"
              >
                <span>Find your invitation</span>
                <span
                  aria-hidden
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-warm-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:-translate-y-0.5 group-hover:translate-x-1"
                >
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </span>
              </Link>
              <Link
                href="/our-story"
                className="text-center text-[11px] uppercase tracking-[0.3em] text-text-secondary transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:text-rose sm:text-left"
              >
                Read our story
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
            <article className="relative overflow-hidden rounded-[2.25rem] border border-white/70 bg-warm-white/90 p-7 shadow-[0_24px_70px_-28px_rgba(90,80,90,0.45)] sm:p-9 md:rotate-1">
              <span
                aria-hidden
                className="absolute inset-4 rounded-[1.75rem] border border-dashed border-rose/20"
              />
              <span
                aria-hidden
                className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-peach/55 blur-2xl"
              />
              <div className="relative">
                <p className="text-[11px] uppercase tracking-[0.4em] text-text-secondary font-body">
                  Countdown
                </p>
                <h2 className="mt-3 font-display display-wonk text-4xl font-light leading-none text-foreground sm:text-5xl">
                  Until we celebrate
                </h2>
              </div>

              <div className="relative mt-9">
                <Countdown />
              </div>

              <p className="relative mt-6 max-w-sm text-sm leading-relaxed text-text-secondary font-body">
                Use your invitation to see the events and timing planned for you.
              </p>
              <p className="relative mt-7 font-accent text-2xl italic leading-none text-rose">
                With love, M&nbsp;&amp;&nbsp;S
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

