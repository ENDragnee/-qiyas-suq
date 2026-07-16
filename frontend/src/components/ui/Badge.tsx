import { ReactNode } from "react";

type Tone = "success" | "error" | "warning" | "neutral" | "primary";

const tones: Record<Tone, string> = {
  success: "bg-success-tint text-success",
  error: "bg-error-tint text-error",
  warning: "bg-warning-tint text-warning",
  neutral: "bg-surface-sunken text-muted",
  primary: "bg-primary-tint text-primary",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-caption font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
