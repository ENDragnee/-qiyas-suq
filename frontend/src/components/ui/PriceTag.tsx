export function PriceTag({
  value,
  size = "md",
  className = "",
}: {
  value: string | number;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <span
      className={`font-mono font-semibold text-foreground ${
        size === "lg" ? "text-num-lg" : "text-num"
      } ${className}`}
    >
      {typeof value === "number" ? value.toLocaleString() : value}
    </span>
  );
}
