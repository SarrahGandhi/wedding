import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Gallery — Murtaza & Sarrah",
  description: "Snapshots from the time we've spent together.",
  openGraph: {
    title: "Gallery — Murtaza & Sarrah",
    description: "Snapshots from the time we've spent together.",
    siteName: "Murtaza & Sarrah",
    locale: "en_CA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gallery — Murtaza & Sarrah",
    description: "Snapshots from the time we've spent together.",
  },
};

interface Photo {
  /** Drop the file in /public/gallery and set e.g. "/gallery/bus-stop.jpg" —
      the card swaps its pastel placeholder for the image automatically. */
  src?: string;
  alt: string;
  caption: string;
  year: string;
  /** Tailwind aspect class — vary these so the masonry stays playful */
  aspect: string;
}

const PHOTOS: Photo[] = [
  {
    alt: "The dinner where it all started",
    caption: "Where it all started",
    year: "2023",
    aspect: "aspect-[4/3]",
    src: "/gallery/firstdinner.JPG",
  },
  {
    alt: "Our first date",
    caption: "First date",
    year: "2023",
    aspect: "aspect-[4/3]",
    src: "/gallery/firstdate.jpg",
  },
  {
    alt: "Costume shopping in Kensington Market",
    caption: "Kensington Market",
    year: "Oct 2023",
    aspect: "aspect-square",
  },
  {
    alt: "New Year's Eve",
    caption: "Midnight, finally official",
    year: "NYE 2023",
    aspect: "aspect-[3/4]",
  },
  {
    alt: "Concerts and park dates",
    caption: "Concert season",
    year: "2024",
    aspect: "aspect-[4/5]",
    src: "/gallery/dayonthepark.jpg",
  },
  {
    alt: "Winter Wonderland",
    caption: "Winter Wonderland",
    year: "2024",
    aspect: "aspect-[5/4]",
    src: "/gallery/winter-wonderland.jpg",
  },
  {
    alt: "Libro the cat",
    caption: "Libro (her favourite)",
    year: "2025",
    aspect: "aspect-[3/4]",
    src: "/gallery/libro.png",
  },
  {
    alt: "First Trip to Montreal",
    caption: "Montréal, our first trip together",
    year: "2025",
    aspect: "aspect-[4/3]",
    src: "/gallery/montreal.jpg",
  },
  {
    alt: "Cliff jumping",
    caption: "The cliff jump",
    year: "2025",
    aspect: "aspect-[4/5]",
  },
  {
    alt: "Layover in Hong Kong",
    caption: "Hong Kong layover",
    year: "2025",
    aspect: "aspect-[5/4]",
    src: "/gallery/hongkong.png",
  },
  {
    alt: "18 hours on an Indian train",
    caption: "18 hours by train",
    year: "2025",
    aspect: "aspect-square",
  },
  {
    alt: "Wedding shopping in India",
    caption: "Wedding shopping, x100",
    year: "2025",
    aspect: "aspect-[3/4]",
  },
  {
    alt: "Forever begins",
    caption: "Forever begins",
    year: "2026",
    aspect: "aspect-[4/3]",
    src: "/gallery/IMG_5230.jpg",
  },
];

/* Placeholder + caption tints cycle through the home page day-card pairings */
const CARD_STYLES = [
  { fill: "from-blush to-mint", accent: "text-rose", icon: "text-rose/30" },
  {
    fill: "from-sky to-peach",
    accent: "text-bluebell",
    icon: "text-bluebell/30",
  },
  {
    fill: "from-peach to-powder",
    accent: "text-tangerine",
    icon: "text-tangerine/30",
  },
  { fill: "from-mint to-sky", accent: "text-leaf", icon: "text-leaf/30" },
  {
    fill: "from-powder to-blush",
    accent: "text-deepblue",
    icon: "text-deepblue/25",
  },
];

const TILTS = [
  "-rotate-2",
  "rotate-1",
  "-rotate-1",
  "rotate-2",
  "rotate-[1.5deg]",
  "-rotate-[1.5deg]",
];

const BLOBS = [
  {
    className: "bg-peach opacity-80",
    top: "-6rem",
    left: "-8rem",
    size: "w-[30rem] h-[30rem]",
    delay: "0s",
  },
  {
    className: "bg-sky opacity-80",
    top: "4%",
    right: "-9rem",
    size: "w-[32rem] h-[32rem]",
    delay: "-6s",
  },
  {
    className: "bg-blush opacity-70",
    top: "30%",
    left: "-7rem",
    size: "w-[26rem] h-[26rem]",
    delay: "-11s",
  },
  {
    className: "bg-mint opacity-70",
    top: "52%",
    right: "-8rem",
    size: "w-[28rem] h-[28rem]",
    delay: "-3s",
  },
  {
    className: "bg-powder opacity-80",
    top: "74%",
    left: "-9rem",
    size: "w-[30rem] h-[30rem]",
    delay: "-9s",
  },
];

const CONFETTI = [
  {
    top: "5%",
    left: "10%",
    color: "bg-tangerine/40",
    delay: "0s",
    size: "w-2 h-2",
  },
  {
    top: "8%",
    left: "88%",
    color: "bg-rose/40",
    delay: "-3s",
    size: "w-2.5 h-2.5",
  },
  {
    top: "28%",
    left: "94%",
    color: "bg-leaf/40",
    delay: "-5s",
    size: "w-2 h-2",
  },
  {
    top: "44%",
    left: "5%",
    color: "bg-bluebell/40",
    delay: "-1.5s",
    size: "w-2.5 h-2.5",
  },
  {
    top: "68%",
    left: "92%",
    color: "bg-tangerine/35",
    delay: "-6s",
    size: "w-2 h-2",
  },
  {
    top: "86%",
    left: "8%",
    color: "bg-rose/35",
    delay: "-2s",
    size: "w-2 h-2",
  },
];

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M8 15h7l3-5h12l3 5h7a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V17a2 2 0 0 1 2-2z" />
      <circle cx="24" cy="26" r="7" />
    </svg>
  );
}

function PhotoCard({ photo, index }: { photo: Photo; index: number }) {
  const style = CARD_STYLES[index % CARD_STYLES.length];
  const tilt = TILTS[index % TILTS.length];
  const delay = `delay-${Math.min((index % 6) * 100 + 100, 800)}`;

  return (
    <figure
      className={`group break-inside-avoid mb-8 ${tilt} rounded-2xl bg-warm-white p-3 pb-4 border border-white/70 shadow-[0_18px_40px_-20px_rgba(90,80,90,0.35)] transition-transform duration-300 hover:rotate-0 hover:-translate-y-1.5 animate-fade-up ${delay}`}
    >
      <div
        className={`relative ${photo.aspect} overflow-hidden rounded-xl bg-linear-to-br ${style.fill}`}
      >
        {photo.src ? (
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <CameraIcon className={`w-12 h-12 ${style.icon}`} />
            <span
              className={`text-[10px] tracking-[0.3em] uppercase font-body ${style.accent} opacity-60`}
            >
              Photo coming soon
            </span>
          </div>
        )}
      </div>
      <figcaption className="flex items-baseline justify-between gap-3 px-2 pt-3">
        <span className="font-accent italic text-lg text-foreground leading-snug">
          {photo.caption}
        </span>
        <span
          className={`shrink-0 text-[10px] tracking-[0.25em] uppercase font-body ${style.accent}`}
        >
          {photo.year}
        </span>
      </figcaption>
    </figure>
  );
}

export default function GalleryPage() {
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
          <p className="text-xs tracking-[0.5em] uppercase text-tangerine font-body mb-6 animate-fade-in">
            Moments we&rsquo;ve collected
          </p>
          <h1 className="font-display display-wonk text-5xl sm:text-7xl md:text-8xl font-light text-foreground leading-tight sm:leading-none animate-fade-up delay-200">
            The{" "}
            <span className="font-accent italic font-normal text-tangerine">Gallery</span>
          </h1>
          <p className="mt-10 text-base md:text-lg text-text-secondary leading-relaxed font-body max-w-xl mx-auto animate-fade-up delay-400">
            A few snapshots from along the way — bus stops, borrowed cats, cliff
            jumps, and eighteen hours on a train.
          </p>
        </div>
      </section>

      {/* Polaroid masonry */}
      <section className="relative max-w-5xl mx-auto px-6 pb-24">
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8">
          {PHOTOS.map((photo, i) => (
            <PhotoCard key={photo.caption} photo={photo} index={i} />
          ))}
        </div>
      </section>

      {/* Closing */}
      <section className="relative pb-24 px-6">
        <div className="relative max-w-2xl mx-auto text-center">
          <p className="font-display display-wonk text-3xl md:text-4xl font-light text-foreground leading-snug">
            Come make the next batch of these with us.
          </p>
          <div className="mt-10">
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
