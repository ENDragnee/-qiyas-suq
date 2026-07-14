import { notFound } from "next/navigation";
import { getShop } from "@/lib/api/shops";
import { ApiError } from "@/lib/api/client";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Shop } from "@/types";

export const dynamic = "force-dynamic";

export default async function ShopProfilePage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;

  let shop: Shop | null = null;
  let error: string | null = null;
  try {
    const res = await getShop(shopId);
    shop = res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    error = err instanceof ApiError ? err.message : "Could not load this shop";
  }

  if (error || !shop) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <EmptyState
          title="Couldn't load shop"
          body={error ?? "Shop not found"}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      {shop.banner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shop.banner}
          alt=""
          className="mb-6 h-40 w-full rounded-md border border-border object-cover"
        />
      ) : (
        <div className="mb-6 h-40 w-full rounded-md bg-gradient-to-br from-primary-tint to-accent-tint" />
      )}
      <h1 className="font-display text-display text-foreground">
        {shop.name}
      </h1>
      <p className="mt-1 text-body-sm text-muted">
        {shop.accounts?.length ?? 0} account
        {shop.accounts?.length === 1 ? "" : "s"}
      </p>

      <div className="mt-8">
        <EmptyState
          title="No item listings here"
          body="Item listings for this shop aren't available on this page — ask them to share a direct item link."
        />
      </div>
    </div>
  );
}
