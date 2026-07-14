import { notFound } from "next/navigation";
import { getItem } from "@/lib/api/items.server";
import { ApiError } from "@/lib/api/client";
import { EmptyState } from "@/components/ui/EmptyState";
import ItemForm from "@/components/dashboard/item-form";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { itemId } = await params;

  let item;
  try {
    const res = await getItem(itemId);
    item = res.data;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    return (
      <EmptyState
        title="Couldn’t load item"
        body="This item may have been deleted or the link is incorrect."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-display text-foreground">Edit item</h1>
        <p className="mt-1 text-body-sm text-muted">Update “{item.name}”.</p>
      </div>
      <ItemForm mode="edit" item={item} />
    </div>
  );
}
