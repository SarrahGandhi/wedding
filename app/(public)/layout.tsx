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
      <main className="relative z-10 flex flex-1 flex-col pt-24">{children}</main>
      <PublicFooter />
    </>
  );
}

function WeddingFrame() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
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
