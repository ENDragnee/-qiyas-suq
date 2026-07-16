import { TextareaHTMLAttributes, forwardRef } from "react";
import { FieldShell } from "./field";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, error, helper, id, className = "", required, ...props },
    ref,
  ) {
    const taId = id ?? props.name;
    return (
      <FieldShell
        id={taId ?? ""}
        label={label ?? ""}
        error={error}
        helper={helper}
        required={required}
      >
        <textarea
          ref={ref}
          id={taId}
          aria-invalid={!!error}
          className={`min-h-11 w-full rounded-sm border bg-surface px-3 py-2.5 text-body text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            error ? "border-error" : "border-border"
          } ${className}`}
          {...props}
        />
      </FieldShell>
    );
  },
);
