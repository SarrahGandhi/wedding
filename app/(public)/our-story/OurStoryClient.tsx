"use client";

import Link from "next/link";
import { useState } from "react";

type Narrator = "murtaza" | "sarrah";

interface Chapter {
  id: string;
  year: string;
  title: string;
  body: string;
}

interface StoryData {
  subtitle: string;
  description: string;
  chapters: Chapter[];
  closing: string;
}

const stories: Record<Narrator, StoryData> = {
  murtaza: {
    subtitle: "As told by Murtaza",
    description:
      "From a bus stop pickup in Mississauga to wedding shopping across India — this is how it happened, from my side of things.",
    chapters: [
      {
        id: "first-meeting",
        year: "Late 2023",
        title: "The Bus Stop Pickup",
        body: "Mom had invited her over for dinner. She’d just moved to Canada and was staying in North York — I was out in Mississauga. I picked her up from the bus stop, and what was supposed to be a simple evening turned into hours of talking. Mostly about food. At some point I told her I wanted to try chocolate biryani. She laughed. It became our thing.",
      },
      {
        id: "halloween",
        year: "October 2023",
        title: "Kensington Market",
        body: 'We met up again right before Halloween for some costume shopping. No real plan — just walked around Toronto, ended up in Kensington Market, tried on ridiculous outfits, and talked smack about how expensive all these "thrift" stores were. It was one of those perfect, effortless days where time just disappears.',
      },
      {
        id: "new-years",
        year: "New Year’s Eve",
        title: "The Awkward Ask",
        body: "On New Year’s I asked her to be my girlfriend — a bit embarrassingly, if I’m honest. And then I immediately dropped her home and drove off to go watch fireworks. She still jokes about how I just left and went to enjoy myself. In my defense, the fireworks were really good.",
      },
      {
        id: "growing",
        year: "2024",
        title: "Falling Into It",
        body: "This was the year we really fell in love. We had some of those hard, honest conversations about life, but talking to her never felt difficult — and she’d say the same about me. We told our families around Eid in April. I even switched to an iPhone so we could FaceTime. Concerts, park dates, Winter Wonderland, arcades, and more food than I can remember.",
      },
      {
        id: "toronto",
        year: "2025",
        title: "The Toronto Year",
        body: "I moved to Toronto and suddenly we could see each other all the time. She helped me decorate my apartment. For a brief stretch I was cat-sitting a friend’s cat and she loved Libro more than she loved me — her words, not mine. We travelled to Montreal for our first festival together. She made me jump off a cliff into water. I was terrified. She was delighted.",
      },
      {
        id: "india",
        year: "Late 2025",
        title: "Hong Kong, India & 18 Hours on a Train",
        body: "She finished her studies, and we celebrated with the trip of a lifetime — a mini layover in Hong Kong, then on to India where I met her parents and her family. We did the classic 18-hour Indian train ride. We did so much wedding shopping that I now know more about women’s clothing and cut styles than any man probably should. It was chaotic, exhausting, and absolutely perfect.",
      },
      {
        id: "forever",
        year: "2026",
        title: "Forever Begins",
        body: "And now here we are. Two people who started with chocolate biryani jokes and thrift store arguments, building a life together. This isn’t the end of the story — it’s just where the best part starts.",
      },
    ],
    closing:
      "From chocolate biryani to forever — we cannot wait to celebrate with you.",
  },
  sarrah: {
    subtitle: "As told by Sarrah",
    description:
      "My version of events. He’ll say it went differently. He’s wrong.",
    chapters: [
      {
        id: "first-meeting",
        year: "2023",
        title: "A Much-Needed Dinner",
        body: "I had just moved to Canada, dealing with terrible roommates and feeling more homesick than I expected. Everything felt a little off — until his mom invited me over for dinner. That night, something shifted. For the first time since I arrived, I forgot all the stress. We just… talked. Mostly about food. He had some very questionable opinions, which I obviously judged — but somehow, it worked. It felt easy. Familiar. And I remember thinking 'okay, this is nice'",
      },
      {
        id: "halloween",
        year: "October 2023",
        title: "The “Just Friends” Date",
        body: "Our first unofficial date was Halloween shopping. We didn’t buy a single thing. But we laughed the entire time, walked around aimlessly, and somehow it turned into one of those days you don’t want to end. I genuinely wouldn’t have had it any other way.",
      },
      {
        id: "first-long-distance",
        year: "December 2023",
        title: "A Week Apart",
        body: "Then came a one-week trip to India for a wedding. It didn’t sound like a big deal… until it was. That was the first time I really missed him. And not in a dramatic way — just in a quiet, constant way. Talking to him never felt like effort, never felt like something I had to do. That’s when it clicked for me.",
      },
      {
        id: "new-years",
        year: "New Year's Eve",
        title: "New Year’s, Finally",
        body: "was late to the New Year’s party. Almost missed midnight. Very on-brand. But I made it just in time — my little Cinderella moment. And that’s when he finally asked me to be his girlfriend. (After missing several very obvious signals, I should add.) He dropped me home after… and then went to watch fireworks. Not his finest moment, but we’ve moved past it.",
      },
      {
        id: "growing",
        year: "2024",
        title: "The Good Part",
        body: "After that, everything just… flowed. The dates, the random plans, the trips — all of it was just fun. No pressure, no overthinking. I just loved spending time with him, doing absolutely anything (or nothing at all).",
      },
      {
        id: "toronto",
        year: "2025",
        title: "Telling the Parents (Kind Of)",
        body: "We eventually told our parents. By we, I mean he told them while I was asleep and had no idea it was happening. His intentions were pure, he just wanted me to spend the weekend with them. Execution? Slightly questionable.",
      },
      {
        id: "india",
        year: "Late 2025",
        title: "Meeting Mine",
        body: "Our first international trip together was to India, via Hong Kong — long flights, little sleep, and a lot of excitement. And then came the big moment: meeting my parents. Safe to say… they love him. Possibly more than me.",
      },
      {
        id: "forever",
        year: "2026",
        title: "Forever Begins",
        body: "Somewhere between that first dinner, random shopping trips, missed signals, long-distance calls, and completely unplanned moments... we built something real.Nothing about this was perfectly planned. Most of it just… happened And somehow, that made it exactly right. So here we are. Forever begins now.",
      },
    ],
    closing: "Turns out, the best things aren’t planned. They just happen.",
  },
};

/* Each narrator re-tints the page — Murtaza reads in bluebell, Sarrah in rose */
const themes: Record<Narrator, { accentText: string; activePill: string }> = {
  murtaza: {
    accentText: "text-bluebell",
    activePill: "bg-bluebell text-warm-white shadow-sm",
  },
  sarrah: {
    accentText: "text-rose",
    activePill: "bg-rose text-warm-white shadow-sm",
  },
};

/* Chapter cards cycle through the same pastel pairings as the home page day cards */
const CHAPTER_STYLES = [
  { card: "from-blush to-mint", accent: "text-rose", dot: "bg-rose/70" },
  { card: "from-sky to-peach", accent: "text-bluebell", dot: "bg-bluebell/70" },
  { card: "from-peach to-powder", accent: "text-tangerine", dot: "bg-tangerine/70" },
  { card: "from-mint to-sky", accent: "text-leaf", dot: "bg-leaf/70" },
  { card: "from-warm-white to-powder", accent: "text-deepblue", dot: "bg-deepblue/60" },
];

const TILTS = ["md:-rotate-2", "md:rotate-1", "md:-rotate-1", "md:rotate-2"];

/* Full-page atmosphere — positions are % of total page height */
const BLOBS = [
  { className: "bg-blush opacity-80", top: "-6rem", right: "-8rem", size: "w-[30rem] h-[30rem]", delay: "0s" },
  { className: "bg-sky opacity-80", top: "2%", left: "-9rem", size: "w-[32rem] h-[32rem]", delay: "-7s" },
  { className: "bg-mint opacity-70", top: "24%", right: "-7rem", size: "w-[26rem] h-[26rem]", delay: "-12s" },
  { className: "bg-peach opacity-70", top: "42%", left: "-8rem", size: "w-[28rem] h-[28rem]", delay: "-4s" },
  { className: "bg-powder opacity-80", top: "62%", right: "-9rem", size: "w-[30rem] h-[30rem]", delay: "-9s" },
  { className: "bg-blush opacity-70", top: "80%", left: "-7rem", size: "w-[26rem] h-[26rem]", delay: "-14s" },
];

const CONFETTI = [
  { top: "6%", left: "12%", color: "bg-rose/45", delay: "0s", size: "w-2 h-2" },
  { top: "4%", left: "84%", color: "bg-bluebell/40", delay: "-3s", size: "w-2.5 h-2.5" },
  { top: "22%", left: "6%", color: "bg-tangerine/40", delay: "-5s", size: "w-2 h-2" },
  { top: "34%", left: "92%", color: "bg-leaf/40", delay: "-1.5s", size: "w-2 h-2" },
  { top: "52%", left: "8%", color: "bg-bluebell/35", delay: "-6s", size: "w-2.5 h-2.5" },
  { top: "66%", left: "90%", color: "bg-rose/35", delay: "-2s", size: "w-2 h-2" },
  { top: "84%", left: "10%", color: "bg-leaf/35", delay: "-4s", size: "w-2 h-2" },
  { top: "92%", left: "86%", color: "bg-tangerine/35", delay: "-7s", size: "w-2.5 h-2.5" },
];

function DottedDivider() {
  return (
    <div aria-hidden className="flex justify-center gap-2.5">
      {["bg-rose/60", "bg-leaf/60", "bg-bluebell/60", "bg-tangerine/60", "bg-deepblue/50"].map(
        (c, i) => (
          <span key={i} className={`w-2 h-2 rounded-full ${c}`} />
        ),
      )}
    </div>
  );
}

function ChapterCard({ chapter, index }: { chapter: Chapter; index: number }) {
  const style = CHAPTER_STYLES[index % CHAPTER_STYLES.length];
  const tilt = TILTS[index % TILTS.length];
  const onLeft = index % 2 === 0;

  return (
    <div
      className={`relative md:grid md:grid-cols-2 md:gap-20 mb-14 md:mb-0 ${
        index > 0 ? "md:-mt-8" : ""
      }`}
    >
      {/* Connector dot on the dashed trail */}
      <span
        aria-hidden
        className={`hidden md:block absolute left-1/2 top-16 -translate-x-1/2 w-3.5 h-3.5 rounded-full ${style.dot} border-[3px] border-background shadow-sm`}
      />
      <article
        className={`group relative rounded-3xl bg-linear-to-br ${style.card} ${tilt} ${
          onLeft ? "" : "md:col-start-2"
        } p-8 pt-12 border border-white/60 shadow-[0_18px_40px_-20px_rgba(90,80,90,0.35)] transition-transform duration-300 md:hover:rotate-0 hover:-translate-y-1.5 md:mb-16`}
      >
        <span
          aria-hidden
          className={`absolute -top-6 left-6 font-display display-wonk italic text-7xl ${style.accent} drop-shadow-[0_2px_0_rgba(255,255,255,0.8)]`}
        >
          {index + 1}
        </span>
        <p
          className={`text-[11px] tracking-[0.3em] uppercase font-body ${style.accent} mt-4 mb-3`}
        >
          {chapter.year}
        </p>
        <h3 className="font-display text-2xl md:text-3xl text-foreground leading-snug mb-3">
          {chapter.title}
        </h3>
        <p className="text-sm md:text-[15px] text-text-secondary font-body leading-relaxed">
          {chapter.body}
        </p>
      </article>
    </div>
  );
}

export function OurStoryClient() {
  const [narrator, setNarrator] = useState<Narrator>("murtaza");
  const story = stories[narrator];
  const theme = themes[narrator];

  return (
    /* -mt-24 cancels the layout's pt-24 so the pastel backdrop runs
       underneath the floating nav to the top of the viewport */
    <div className="grain relative -mt-24 overflow-hidden">
      {/* Soft pastel atmosphere spanning the whole page */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {BLOBS.map((blob, i) => (
          <div
            key={i}
            className={`absolute rounded-full blur-3xl animate-drift ${blob.className} ${blob.size}`}
            style={{
              top: blob.top,
              left: blob.left,
              right: blob.right,
              animationDelay: blob.delay,
            }}
          />
        ))}
        {CONFETTI.map((dot, i) => (
          <span
            key={i}
            className={`absolute rounded-full ${dot.color} ${dot.size} animate-bob hidden sm:block`}
            style={{ top: dot.top, left: dot.left, animationDelay: dot.delay }}
          />
        ))}
      </div>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-40 pb-16">
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <p
            key={`subtitle-${narrator}`}
            className={`text-xs tracking-[0.5em] uppercase ${theme.accentText} font-body mb-6 animate-fade-in`}
          >
            {story.subtitle}
          </p>
          <h1 className="font-display display-wonk text-5xl sm:text-7xl md:text-8xl font-light text-foreground leading-tight sm:leading-none animate-fade-up delay-200">
            Our <span className={`italic font-normal ${theme.accentText}`}>Story</span>
          </h1>

          {/* Narrator toggle */}
          <div className="mt-10 flex items-center justify-center gap-1 bg-warm-white/75 backdrop-blur-xl border border-white/70 shadow-[0_14px_36px_-14px_rgba(90,80,90,0.4)] p-1.5 rounded-full w-fit mx-auto animate-fade-up delay-400">
            <button
              onClick={() => setNarrator("murtaza")}
              className={`px-5 py-2 text-[11px] tracking-[0.25em] uppercase font-body rounded-full transition-all duration-300 cursor-pointer ${
                narrator === "murtaza"
                  ? themes.murtaza.activePill
                  : "text-text-secondary hover:text-bluebell"
              }`}
            >
              Murtaza
            </button>
            <button
              onClick={() => setNarrator("sarrah")}
              className={`px-5 py-2 text-[11px] tracking-[0.25em] uppercase font-body rounded-full transition-all duration-300 cursor-pointer ${
                narrator === "sarrah"
                  ? themes.sarrah.activePill
                  : "text-text-secondary hover:text-rose"
              }`}
            >
              Sarrah
            </button>
          </div>

          <p
            key={`description-${narrator}`}
            className="mt-10 text-base md:text-lg text-text-secondary leading-relaxed font-body max-w-xl mx-auto animate-fade-in"
          >
            {story.description}
          </p>
        </div>
      </section>

      {/* Playful dotted divider */}
      <div className="relative pb-16">
        <DottedDivider />
      </div>

      {/* Chapter trail — tilted cards zigzag down a dashed path */}
      <section className="relative max-w-4xl mx-auto px-6 pb-20">
        <div key={`timeline-${narrator}`} className="relative animate-fade-in">
          {/* Dashed trail behind the cards */}
          <div
            aria-hidden
            className="hidden md:block absolute left-1/2 top-4 bottom-4 -translate-x-1/2 border-l-2 border-dashed border-deepblue/15"
          />
          {story.chapters.map((chapter, i) => (
            <ChapterCard key={chapter.id} chapter={chapter} index={i} />
          ))}
          <div className="relative flex justify-center">
            <HeartIcon className="w-8 h-8 text-rose/70 bg-background rounded-full p-1" />
          </div>
        </div>
      </section>

      {/* Closing section */}
      <section className="relative py-20 px-6">
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="mb-12">
            <DottedDivider />
          </div>
          <p
            key={`closing-${narrator}`}
            className="font-display display-wonk text-3xl md:text-4xl lg:text-5xl font-light text-foreground leading-snug animate-fade-in"
          >
            {story.closing}
          </p>
          <p className={`mt-10 text-sm tracking-[0.3em] uppercase ${theme.accentText} font-body`}>
            October 22, 2026
          </p>
          <div className="mt-12">
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

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M24 41C16 34.5 6.5 27 6.5 17.5 6.5 11.5 11 7 16.5 7c3 0 5.8 1.5 7.5 4 1.7-2.5 4.5-4 7.5-4C37 7 41.5 11.5 41.5 17.5 41.5 27 32 34.5 24 41z" />
    </svg>
  );
}
