import { ReactNode } from "react";

export function FieldShell({
  id,
  label,
  error,
  helper,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-body-sm font-medium text-foreground">
        {label}
        {required && <span className="text-error"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="text-caption text-error">{error}</p>
      ) : helper ? (
        <p className="text-caption text-muted">{helper}</p>
      ) : null}
    </div>
  );
}
