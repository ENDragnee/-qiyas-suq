import { SelectHTMLAttributes, forwardRef } from "react";
import { FieldShell } from "./field";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helper?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, helper, id, className = "", required, options, ...props },
  ref,
) {
  const selectId = id ?? props.name;
  return (
    <FieldShell
      id={selectId ?? ""}
      label={label ?? ""}
      error={error}
      helper={helper}
      required={required}
    >
      <select
        ref={ref}
        id={selectId}
        aria-invalid={!!error}
        className={`min-h-11 w-full rounded-sm border bg-surface px-3 py-2.5 text-body text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary ${
          error ? "border-error" : "border-border"
        } ${className}`}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});
