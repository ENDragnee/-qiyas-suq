import Link from "next/link";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-20">
      <div className="flex flex-col gap-6">
        <span className="text-caption uppercase tracking-[0.03em] text-muted">
          Shop inventory &amp; sales
        </span>
        <h1 className="font-display text-display text-foreground">
          Kiyas — keep your shop&apos;s stock and sales in order.
        </h1>
        <p className="max-w-xl text-body text-muted">
          A calm, fast tool for shop staff to manage inventory and track sales.
          Browse the public shop directory, or sign in to manage your own shop.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-body font-medium text-inverse hover:bg-primary-hover"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="inline-flex h-11 items-center justify-center rounded-md bg-accent px-4 text-body font-medium text-foreground hover:bg-accent-hover"
          >
            Have a shop invite? Join
          </Link>
          <Link
            href="/shops"
            className="inline-flex h-11 items-center justify-center rounded-md border border-border-strong bg-surface px-4 text-body font-medium text-foreground hover:bg-surface-sunken"
          >
            Browse shops
          </Link>
        </div>
      </div>
    </div>
  );
}
