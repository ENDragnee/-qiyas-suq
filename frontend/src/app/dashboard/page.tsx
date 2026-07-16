import Link from "next/link";
import { redirect } from "next/navigation";
import { getItems } from "@/lib/api/items.server";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import ItemTable from "@/components/dashboard/item-table";
import type { Item } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let items: Item[] = [];
  let hasNext = false;
  let page = 1;

  try {
    const res = await getItems(1, 10);
    items = res.data;
    hasNext = res.metadata?.hasNextPage ?? false;
    page = res.metadata?.currentPage ?? 1;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login?next=/dashboard");
    }
    return (
      <div className="flex flex-col gap-6">
        <DashboardHeader />
        <EmptyState
          title="Couldn’t load inventory"
          body="Something went wrong loading your items. Try again in a moment."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader />
      <ItemTable
        initialItems={items}
        initialHasNext={hasNext}
        initialPage={page}
      />
    </div>
  );
}

function DashboardHeader() {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-display text-foreground">Your items</h1>
        <p className="mt-1 text-body-sm text-muted">
          Manage this shop’s inventory.
        </p>
      </div>
      <Link href="/dashboard/items/new">
        <Button>New item</Button>
      </Link>
    </div>
  );
}
