import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { logoutAction } from "@/app/admin/actions";
import { AdminNav } from "./AdminNav";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireAdmin();

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-border/40 bg-warm-white/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <Link
              href="/admin/dashboard"
              className="font-display italic text-2xl text-foreground hover:text-accent transition-colors leading-none"
            >
              Admin.
            </Link>
            <span className="text-[10px] tracking-[0.3em] uppercase text-muted font-body">
              Murtaza &amp; Sarrah
            </span>
          </div>
          <AdminNav />
        </div>
        <div className="max-w-6xl mx-auto px-6 pb-3 flex items-center justify-between text-[10px] tracking-[0.25em] uppercase font-body text-text-secondary">
          <span className="truncate">
            <span className="text-muted">Signed in · </span>
            {user.email}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="hover:text-accent transition-colors cursor-pointer"
            >
              Sign out &rarr;
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10">
        {children}
      </main>

      <footer className="border-t border-border/40 py-6 text-center">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted font-body">
          Back of house · Private
        </p>
      </footer>
    </div>
  );
}
