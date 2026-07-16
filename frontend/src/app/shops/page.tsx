import { getShops } from "@/lib/api/shops";
import { ShopCard } from "@/components/shop/shop-card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ApiError } from "@/lib/api/client";
import type { Shop } from "@/types";

export const dynamic = "force-dynamic";

export default async function ShopsPage() {
  let shops: Shop[] | null = null;
  let error: string | null = null;

  try {
    const res = await getShops({ limit: 50 });
    shops = res.data;
  } catch (err) {
    error = err instanceof ApiError ? err.message : "Could not load shops";
  }

  let content;
  if (error) {
    content = <EmptyState title="Couldn't load shops" body={error} />;
  } else if (shops && shops.length === 0) {
    content = (
      <EmptyState
        title="No shops yet"
        body="Shops will appear here once they're created."
      />
    );
  } else {
    content = (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shops!.map((shop) => (
          <ShopCard key={shop._id} shop={shop} />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="mb-6 font-display text-display text-foreground">Shops</h1>
      {content}
    </div>
  );
}
