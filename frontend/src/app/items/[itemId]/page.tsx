import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getItem } from "@/lib/api/items.server";
import { ApiError } from "@/lib/api/client";
import { ItemDetailPanel } from "@/components/shop/item-detail-panel";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Item } from "@/types";

export const dynamic = "force-dynamic";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;
  const store = await cookies();
  const authed = store.has("connect.sid");

  let item: Item | null = null;
  let error: string | null = null;
  try {
    const res = await getItem(itemId);
    item = res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    error = err instanceof ApiError ? err.message : "Could not load this item";
  }

  if (error || !item) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <EmptyState
          title="Couldn't load item"
          body={error ?? "Item not found"}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8">
      <ItemDetailPanel item={item} authed={authed} />
    </div>
  );
}
