import Link from "next/link";
import { NavLinks } from "../components/NavLinks";

export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/40">
        <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-display text-xl font-semibold tracking-wide text-foreground hover:text-accent transition-colors"
          >
            <img src="/logo.png" alt="Logo" className="h-10" />
          </Link>
          <NavLinks />
        </nav>
      </header>
      <main className="flex-1 pt-16 flex flex-col">{children}</main>
      <footer className="border-t border-border/40 py-10 text-center shrink-0 w-full mt-auto">
        <p className="font-display text-lg text-accent tracking-widest">
          Murtaza & Sarrah
        </p>
        <p className="text-xs text-text-secondary mt-2 font-body tracking-wide uppercase">
          October 22, 2026
        </p>
      </footer>
    </>
  );
}
