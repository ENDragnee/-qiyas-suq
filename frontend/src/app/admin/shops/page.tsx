import Link from "next/link";
import { redirect } from "next/navigation";
import { getShops } from "@/lib/api/shops";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import ShopTable from "@/components/admin/shop-table";
import type { Shop } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminShopsPage() {
  let shops: Shop[] = [];
  let hasNext = false;
  let page = 1;

  try {
    const res = await getShops({ page: 1, limit: 10 });
    shops = res.data;
    hasNext = res.metadata?.hasNextPage ?? false;
    page = res.metadata?.currentPage ?? 1;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      redirect("/login?next=/admin/shops");
    }
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <EmptyState
          title="Couldn’t load shops"
          body="Something went wrong loading the shop list. Try again in a moment."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Header />
      <ShopTable
        initialShops={shops}
        initialHasNext={hasNext}
        initialPage={page}
      />
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-display text-foreground">Shops</h1>
        <p className="mt-1 text-body-sm text-muted">
          Create and manage shops on the platform.
        </p>
      </div>
      <Link href="/admin/shops/new">
        <Button>New shop</Button>
      </Link>
    </div>
  );
}
