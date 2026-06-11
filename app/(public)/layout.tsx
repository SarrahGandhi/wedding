import { FloatingNav } from "../components/FloatingNav";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <FloatingNav />
      <main className="flex-1 pt-24 flex flex-col">{children}</main>
      <footer className="border-t border-border/40 py-10 text-center shrink-0 w-full mt-auto">
        <p className="font-display italic text-lg text-rose tracking-widest">
          Murtaza & Sarrah
        </p>
        <p className="text-xs text-text-secondary mt-2 font-body tracking-wide uppercase">
          October 20 – 22, 2026
        </p>
      </footer>
    </>
  );
}
