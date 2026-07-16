import Link from "next/link";
import type { Shop } from "@/types";

export function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Link
      href={`/shops/${shop._id}`}
      className="flex flex-col overflow-hidden rounded-md border border-border bg-surface transition-colors hover:border-border-strong"
    >
      {shop.banner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shop.banner}
          alt=""
          className="h-28 w-full bg-surface-sunken object-cover"
        />
      ) : (
        <div className="h-28 w-full bg-gradient-to-br from-primary-tint to-accent-tint" />
      )}
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-title text-title text-foreground">{shop.name}</h3>
        <p className="text-caption text-muted">
          {shop.accounts?.length ?? 0} account
          {shop.accounts?.length === 1 ? "" : "s"}
        </p>
      </div>
    </Link>
  );
}
