import type { ButtonHTMLAttributes } from "react";

const VARIANT = {
  primary:
    "px-5 py-2 bg-foreground text-background text-[10px] tracking-[0.3em] uppercase font-body hover:bg-accent transition-colors disabled:opacity-40 cursor-pointer",
  block:
    "w-full bg-foreground text-background py-3 text-[10px] tracking-[0.3em] uppercase font-body hover:bg-accent transition-colors disabled:opacity-40 cursor-pointer",
  secondary:
    "px-4 py-2 border border-border text-text-secondary hover:text-accent hover:border-accent text-[10px] tracking-[0.25em] uppercase font-body transition-colors disabled:opacity-40 cursor-pointer",
  ghost:
    "text-[10px] tracking-[0.25em] uppercase font-body text-text-secondary hover:text-accent transition-colors cursor-pointer disabled:opacity-40",
  danger:
    "text-[10px] tracking-[0.25em] uppercase font-body text-text-secondary hover:text-red-500 transition-colors cursor-pointer disabled:opacity-40",
} as const;

type Variant = keyof typeof VARIANT;

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  pending?: boolean;
};

export function Button({
  variant = "primary",
  pending,
  disabled,
  className,
  type = "button",
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled ?? pending}
      className={`${VARIANT[variant]} ${className ?? ""}`.trimEnd()}
      {...rest}
    />
  );
}
