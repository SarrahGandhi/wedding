"use client";

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
  quote: string;
  quoteAttribution: string;
  chapters: Chapter[];
  closing: string;
}

const stories: Record<Narrator, StoryData> = {
  murtaza: {
    subtitle: "As told by Murtaza",
    description:
      "From a bus stop pickup in Mississauga to wedding shopping across India — this is how it happened, from my side of things.",
    quote:
      "I said chocolate biryani. She said I was insane. Nothing about us was planned. Everything about us was right.",
    quoteAttribution: "Murtaza",
    chapters: [
      {
        id: "first-meeting",
        year: "Late 2023",
        title: "The Bus Stop Pickup",
        body: "Mom had invited her over for dinner. She\u2019d just moved to Canada and was staying in North York \u2014 I was out in Mississauga. I picked her up from the bus stop, and what was supposed to be a simple evening turned into hours of talking. Mostly about food. At some point I told her I wanted to try chocolate biryani. She laughed. It became our thing.",
      },
      {
        id: "halloween",
        year: "October 2023",
        title: "Kensington Market",
        body: 'We met up again right before Halloween for some costume shopping. No real plan \u2014 just walked around Toronto, ended up in Kensington Market, tried on ridiculous outfits, and talked smack about how expensive all these "thrift" stores were. It was one of those perfect, effortless days where time just disappears.',
      },
      {
        id: "new-years",
        year: "New Year\u2019s Eve",
        title: "The Awkward Ask",
        body: "On New Year\u2019s I asked her to be my girlfriend \u2014 a bit embarrassingly, if I\u2019m honest. And then I immediately dropped her home and drove off to go watch fireworks. She still jokes about how I just left and went to enjoy myself. In my defense, the fireworks were really good.",
      },
      {
        id: "growing",
        year: "2024",
        title: "Falling Into It",
        body: "This was the year we really fell in love. We had some of those hard, honest conversations about life, but talking to her never felt difficult \u2014 and she\u2019d say the same about me. We told our families around Eid in April. I even switched to an iPhone so we could FaceTime. Concerts, park dates, Winter Wonderland, arcades, and more food than I can remember.",
      },
      {
        id: "toronto",
        year: "2025",
        title: "The Toronto Year",
        body: "I moved to Toronto and suddenly we could see each other all the time. She helped me decorate my apartment. For a brief stretch I was cat-sitting a friend\u2019s cat and she loved Libro more than she loved me \u2014 her words, not mine. We travelled to Montreal for our first festival together. She made me jump off a cliff into water. I was terrified. She was delighted.",
      },
      {
        id: "india",
        year: "Late 2025",
        title: "Hong Kong, India & 18 Hours on a Train",
        body: "She finished her studies, and we celebrated with the trip of a lifetime \u2014 a mini layover in Hong Kong, then on to India where I met her parents and her family. We did the classic 18-hour Indian train ride. We did so much wedding shopping that I now know more about women\u2019s clothing and cut styles than any man probably should. It was chaotic, exhausting, and absolutely perfect.",
      },
      {
        id: "forever",
        year: "2026",
        title: "Forever Begins",
        body: "And now here we are. Two people who started with chocolate biryani jokes and thrift store arguments, building a life together. This isn\u2019t the end of the story \u2014 it\u2019s just where the best part starts.",
      },
    ],
    closing:
      "From chocolate biryani to forever \u2014 we cannot wait to celebrate with you.",
  },
  sarrah: {
    subtitle: "As told by Sarrah",
    description:
      "My version of events. He\u2019ll say it went differently. He\u2019s wrong.",
    quote:
      "Life is short. Dance more. Pet every cat you meet. Marry the one who lets you do both.",
    quoteAttribution: "Sarrah",
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

function TimelineEntry({
  year,
  title,
  body,
  align,
}: {
  year: string;
  title: string;
  body: string;
  align: "left" | "right";
}) {
  const content = (isLeftAlignNode: boolean) => (
    <>
      <p className="text-xs tracking-[0.4em] uppercase text-accent font-body mb-2">
        {year}
      </p>
      <h3 className="font-display text-2xl md:text-3xl font-light text-foreground mb-3 leading-snug">
        {title}
      </h3>
      <p
        className={`text-sm md:text-base text-text-secondary leading-relaxed font-body max-w-sm ${isLeftAlignNode ? "ml-auto" : ""}`}
      >
        {body}
      </p>
    </>
  );

  return (
    <div className="relative flex gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-10 items-start mb-10 md:mb-0 group">
      {/* Mobile Line */}
      <div className="flex flex-col items-center md:hidden pt-2 shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-accent/60 border-2 border-background ring-2 ring-accent/20" />
        <div className="w-px flex-1 bg-border/60 min-h-full" />
      </div>

      {/* Content for left column on desktop */}
      <div
        className={`hidden md:block ${align === "left" ? "text-right" : "opacity-0 pointer-events-none"}`}
      >
        {align === "left" && content(true)}
      </div>

      {/* Center line for desktop */}
      <div className="hidden md:flex flex-col items-center pt-2 h-full">
        <div className="w-2.5 h-2.5 shrink-0 rounded-full bg-accent/60 border-2 border-background ring-2 ring-accent/20" />
        <div className="w-px flex-1 bg-border/60 min-h-[80px]" />
      </div>

      {/* Content for mobile (always left aligned) AND right column on desktop */}
      <div
        className={`pb-8 md:pb-0 ${align === "left" ? "md:opacity-0 md:pointer-events-none" : ""}`}
      >
        <div className={align === "left" ? "md:hidden" : ""}>
          {content(false)}
        </div>
      </div>
    </div>
  );
}

export function OurStoryClient() {
  const [narrator, setNarrator] = useState<Narrator>("murtaza");
  const story = stories[narrator];

  return (
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative flex flex-col items-center justify-center py-32 md:py-44 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-cream/50 via-background to-background" />
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.5em] uppercase text-accent font-body mb-6 animate-fade-in">
            {story.subtitle}
          </p>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-foreground animate-fade-up delay-100">
            Our Story
          </h1>

          {/* Narrator toggle */}
          <div className="mt-8 flex items-center justify-center gap-1 bg-cream/60 p-1 rounded-full w-fit mx-auto">
            <button
              onClick={() => setNarrator("murtaza")}
              className={`px-5 py-2 text-[11px] tracking-[0.25em] uppercase font-body rounded-full transition-all duration-300 cursor-pointer ${
                narrator === "murtaza"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              Murtaza
            </button>
            <button
              onClick={() => setNarrator("sarrah")}
              className={`px-5 py-2 text-[11px] tracking-[0.25em] uppercase font-body rounded-full transition-all duration-300 cursor-pointer ${
                narrator === "sarrah"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              Sarrah
            </button>
          </div>

          <div className="mt-8 w-24 h-px bg-accent/40 mx-auto" />
          <p className="mt-8 text-base md:text-lg text-text-secondary leading-relaxed font-body max-w-xl mx-auto">
            {story.description}
          </p>
        </div>
      </section>

      {/* Opening quote */}
      <section className="max-w-2xl mx-auto px-6 pb-20">
        <blockquote className="font-display text-2xl md:text-3xl lg:text-4xl font-light text-foreground leading-snug text-center italic">
          &ldquo;{story.quote}&rdquo;
        </blockquote>
        <p className="text-center text-xs tracking-[0.3em] uppercase text-text-secondary font-body mt-6">
          &mdash; {story.quoteAttribution}
        </p>
      </section>

      {/* Decorative divider */}
      <div className="flex items-center justify-center gap-4 pb-20">
        <div className="w-16 h-px bg-border" />
        <div className="w-1.5 h-1.5 rounded-full bg-accent/40" />
        <div className="w-16 h-px bg-border" />
      </div>

      {/* Timeline */}
      <section className="max-w-3xl mx-auto px-6 pb-32">
        <div className="flex flex-col">
          {story.chapters.map((chapter, i) => (
            <TimelineEntry
              key={chapter.id}
              year={chapter.year}
              title={chapter.title}
              body={chapter.body}
              align={i % 2 === 0 ? "right" : "left"}
            />
          ))}
          <div className="flex justify-center">
            <div className="w-4 h-4 rounded-full bg-accent/30 border-2 border-accent/50 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            </div>
          </div>
        </div>
      </section>

      {/* Closing section */}
      <section className="bg-linear-to-b from-background via-cream/30 to-background py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-display text-3xl md:text-4xl lg:text-5xl font-light text-foreground leading-snug">
            {story.closing}
          </p>
          <div className="mt-10 w-24 h-px bg-accent/40 mx-auto" />
          <p className="mt-10 text-sm tracking-[0.3em] uppercase text-accent font-body">
            October 22, 2026
          </p>
        </div>
      </section>
    </div>
  );
}
