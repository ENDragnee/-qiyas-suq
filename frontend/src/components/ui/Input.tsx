import { InputHTMLAttributes, forwardRef } from "react";
import { FieldShell } from "./field";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helper, id, className = "", required, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <FieldShell
      id={inputId ?? ""}
      label={label ?? ""}
      error={error}
      helper={helper}
      required={required}
    >
      <input
        ref={ref}
        id={inputId}
        aria-invalid={!!error}
        className={`min-h-11 w-full rounded-sm border bg-surface px-3 py-2.5 text-body text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          error ? "border-error" : "border-border"
        } ${className}`}
        {...props}
      />
    </FieldShell>
  );
});
