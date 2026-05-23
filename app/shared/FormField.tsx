import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const LABEL_TONE = {
  default: "text-text-secondary",
  muted: "text-muted",
} as const;

const FIELD_INPUT = {
  sm: "mt-1 w-full bg-warm-white border border-border/60 px-3 py-2 font-body text-sm focus:outline-none focus:border-accent/60 transition-colors disabled:opacity-60",
  lg: "mt-2 w-full bg-warm-white border border-border/60 px-4 py-3 font-body text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/60 transition-colors disabled:opacity-60",
} as const;

type Size = keyof typeof FIELD_INPUT;
type LabelTone = keyof typeof LABEL_TONE;

type FieldLabelProps = {
  label: string;
  tone?: LabelTone;
  className?: string;
  children: ReactNode;
};

export function FieldLabel({
  label,
  tone = "default",
  className,
  children,
}: FieldLabelProps) {
  return (
    <label className={`block ${className ?? ""}`.trimEnd()}>
      <span
        className={`text-[10px] tracking-[0.25em] uppercase ${LABEL_TONE[tone]} font-body`}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

type CommonFieldProps = {
  label: string;
  size?: Size;
  labelTone?: LabelTone;
  labelClassName?: string;
};

type FormFieldProps = CommonFieldProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "size">;

export function FormField({
  label,
  size = "sm",
  labelTone = "default",
  labelClassName,
  className,
  ...inputProps
}: FormFieldProps) {
  return (
    <FieldLabel label={label} tone={labelTone} className={labelClassName}>
      <input
        {...inputProps}
        className={`${FIELD_INPUT[size]} ${className ?? ""}`.trimEnd()}
      />
    </FieldLabel>
  );
}

type SelectFieldProps = CommonFieldProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
    children: ReactNode;
  };

export function SelectField({
  label,
  size = "sm",
  labelTone = "default",
  labelClassName,
  className,
  children,
  ...selectProps
}: SelectFieldProps) {
  return (
    <FieldLabel label={label} tone={labelTone} className={labelClassName}>
      <select
        {...selectProps}
        className={`${FIELD_INPUT[size]} ${className ?? ""}`.trimEnd()}
      >
        {children}
      </select>
    </FieldLabel>
  );
}

type TextareaFieldProps = CommonFieldProps &
  TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextareaField({
  label,
  size = "sm",
  labelTone = "default",
  labelClassName,
  className,
  ...textareaProps
}: TextareaFieldProps) {
  return (
    <FieldLabel label={label} tone={labelTone} className={labelClassName}>
      <textarea
        {...textareaProps}
        className={`${FIELD_INPUT[size]} leading-relaxed resize-y ${className ?? ""}`.trimEnd()}
      />
    </FieldLabel>
  );
}
