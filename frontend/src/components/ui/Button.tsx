import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "destructive";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.97]";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-inverse hover:bg-primary-hover",
  accent: "bg-accent text-foreground hover:bg-accent-hover",
  secondary:
    "border border-border-strong bg-surface text-foreground hover:bg-surface-sunken",
  ghost: "text-foreground hover:bg-surface-sunken",
  destructive: "bg-error text-inverse hover:bg-error/90",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-body-sm",
  md: "h-11 px-4 text-body",
  lg: "h-12 px-6 text-body",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "md",
      loading = false,
      className = "",
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);
