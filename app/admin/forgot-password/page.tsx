import { ForgotPasswordForm } from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-full flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm animate-fade-up">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.4em] uppercase text-accent font-body mb-4">
            Murtaza &amp; Sarrah
          </p>
          <h1 className="font-display italic text-5xl font-light text-foreground leading-none">
            Reset.
          </h1>
          <div className="mt-5 w-10 h-px bg-accent/40 mx-auto" />
          <p className="text-xs text-text-secondary font-body mt-5 leading-relaxed">
            Enter the email address associated with your admin account
            and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  );
}
