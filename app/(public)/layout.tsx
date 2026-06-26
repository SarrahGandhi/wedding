import { BackgroundMusic } from "../components/BackgroundMusic";
import { FloatingNav } from "../components/FloatingNav";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <WeddingFrame />
      <FloatingNav />
      <BackgroundMusic />
      <main className="relative z-10 flex flex-1 flex-col pt-24">{children}</main>
      <PublicFooter />
    </>
  );
}

function WeddingFrame() {
  return (
    <div
      aria-hidden
      className="grain pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <span className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-blush/45 blur-3xl animate-drift" />
      <span className="absolute right-[-7rem] top-10 h-96 w-96 rounded-full bg-peach/35 blur-3xl animate-drift delay-300" />
      <span className="absolute bottom-8 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-sky/35 blur-3xl animate-drift delay-600" />
      <span className="absolute left-[12%] top-[32%] hidden h-1.5 w-1.5 rounded-full bg-tangerine/35 animate-bob sm:block" />
      <span className="absolute right-[18%] top-[24%] hidden h-2 w-2 rounded-full bg-rose/25 animate-bob delay-500 sm:block" />
      <span className="absolute bottom-[22%] right-[12%] hidden h-1 w-1 rounded-full bg-bluebell/30 animate-bob delay-700 sm:block" />
      <div className="absolute inset-x-5 top-5 bottom-5 hidden rounded-[2.5rem] border border-white/50 sm:block" />
      <div className="absolute left-8 top-1/2 hidden h-[42vh] w-px -translate-y-1/2 bg-linear-to-b from-transparent via-rose/25 to-transparent lg:block" />
      <div className="absolute right-8 top-1/2 hidden h-[42vh] w-px -translate-y-1/2 bg-linear-to-b from-transparent via-bluebell/25 to-transparent lg:block" />
    </div>
  );
}

function PublicFooter() {
  return (
    <footer className="relative z-10 px-6 pb-6">
      <div className="mx-auto flex w-fit items-center gap-3 rounded-full border border-white/60 bg-warm-white/65 px-5 py-2 text-[10px] uppercase tracking-[0.35em] text-text-secondary shadow-[0_12px_30px_-22px_rgba(90,80,90,0.45)] backdrop-blur-xl">
        <span>October 22, 2026</span>
        <span className="h-1.5 w-1.5 rounded-full bg-rose/45" />
        <span>Murtaza & Sarrah</span>
      </div>
    </footer>
  );
}
