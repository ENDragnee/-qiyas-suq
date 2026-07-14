import ItemForm from "@/components/dashboard/item-form";

export const dynamic = "force-dynamic";

export default function NewItemPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-display text-foreground">New item</h1>
        <p className="mt-1 text-body-sm text-muted">
          Add an item to this shop’s inventory.
        </p>
      </div>
      <ItemForm mode="create" />
    </div>
  );
}
