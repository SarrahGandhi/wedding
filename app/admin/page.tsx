import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/admin/dashboard");

  return (
    <div className="min-h-full flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-4">
            Murtaza &amp; Sarrah
          </p>
          <h1 className="font-display italic text-5xl font-light text-foreground leading-none">
            Admin.
          </h1>
          <div className="mt-5 w-10 h-px bg-accent/40 mx-auto" />
          <p className="text-xs text-text-secondary font-body mt-5 leading-relaxed">
            Private back-of-house. Sign in with the credentials provisioned for
            you.
          </p>
        </div>

        <LoginForm />

        <p className="mt-10 text-center text-[10px] tracking-[0.25em] uppercase text-muted font-body">
          Invitation only · No registration
        </p>
      </div>
    </div>
  );
}
