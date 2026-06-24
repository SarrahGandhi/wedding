import Link from "next/link";
import { Countdown } from "../components/Countdown";

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      <section className="relative -mt-24 min-h-screen overflow-hidden px-5 pb-20 pt-32 sm:px-6 lg:pt-28">
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
            <p className="mt-8 font-accent text-3xl italic leading-snug text-bluebell sm:text-4xl">
              October 22, 2026
            </p>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-text-secondary font-body sm:text-base">
              We can&apos;t wait to celebrate with the people who made our story feel like home.
            </p>
            <div className="mt-9 flex justify-center">
              <Link
                href="/invitation"
                className="inline-block rounded-full bg-deepblue px-10 py-4 text-center text-xs uppercase tracking-[0.3em] text-warm-white shadow-[0_14px_30px_-12px_var(--bluebell)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-rose"
              >
                Find Your Invitation
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
                  Until we celebrate
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
                  October 22, 2026
                </span>
              </div>
              <p className="relative mt-6 max-w-sm text-sm leading-relaxed text-text-secondary font-body">
                Use your invitation to see the events and timing planned for you.
              </p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}

